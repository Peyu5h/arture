"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useEditor } from "~/hooks/useEditor";
import { fabric } from "fabric";
import { Navbar } from "~/components/editor/navbar";
import { Toolbar } from "~/components/editor/toolbar";
import { Sidebar } from "~/components/editor/sidebar/sidebar";
import { ActiveTool, selectionDependentTool } from "~/lib/types";
import { ShapeSidebar } from "~/components/editor/sidebar/shapes/shape-sidebar";
import { FillColorSidebar } from "~/components/editor/sidebar/fillColor/fillColorSidebar";
import { StrokeColorSidebar } from "~/components/editor/sidebar/fillColor/strokeColorSidebar";
import { AISidebar } from "~/components/editor/sidebar/ai/ai-sidebar";
import { DrawSidebar } from "~/components/editor/sidebar/draw/draw-sidebar";
import { ImageSidebar } from "~/components/editor/sidebar/image/image-sidebar";
import { SettingsSidebar } from "~/components/editor/sidebar/settings/settings-sidebar";
import { TextSidebar } from "~/components/editor/sidebar/text/text-sidebar";
import { FontSidebar } from "~/components/editor/sidebar/text/font-sidebar";
import { DesignSidebar } from "~/components/editor/sidebar/design/design-sidebar";
import { ZoomControls } from "~/components/editor/zoom-controls";
import { useParams } from "next/navigation";
import { useProject } from "~/hooks/projects.hooks";
import { LucideLoader2 } from "lucide-react";
import { useAutoSave } from "~/hooks/useAutoSave";
import { useCanvasEvents } from "~/hooks/useCanvasEvents";
import { AuthGuard } from "~/components/auth-guard";
import { CanvasSkeleton } from "~/components/editor/canvas-skeleton";
import { AgentPanel } from "~/components/editor/agent";
import {
  DragProvider,
  useDragContext,
  DragItem,
} from "~/contexts/drag-context";
import { DragPreview } from "~/components/editor/drag-preview";
import { CanvasDropZone } from "~/components/editor/canvas-drop-zone";

function EditorContent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const projectId = useParams().projectId;
  const {
    data: project,
    isLoading: isProjectLoading,
    error: projectError,
  } = useProject(`${projectId}`);

  const [activeTool, setActiveTool] = React.useState<ActiveTool>("select");
  const [unsavedChanges, setUnsavedChanges] = React.useState(false);
  const [selectedObjects, setSelectedObjects] = React.useState<
    fabric.Object[] | null
  >(null);
  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(true);

  const { dragState, setOnDrop } = useDragContext();
  const setOnDropRef = useRef(setOnDrop);
  setOnDropRef.current = setOnDrop;

  const onClearSelection = useCallback(() => {
    if (selectionDependentTool.includes(activeTool)) {
      setActiveTool("select");
    }
  }, [activeTool]);

  const { init, editor } = useEditor({
    clearSelection: onClearSelection,
    onModified: () => setUnsavedChanges(true),
  });

  // handle drag drop onto canvas
  const handleDrop = useCallback(
    (item: DragItem, position: { x: number; y: number }) => {
      if (!editor || !containerRef.current) return;

      const canvas = editor.canvas;
      if (!canvas) return;

      // convert screen position to canvas coordinates
      const vpt = canvas.viewportTransform;
      if (!vpt) return;

      const canvasX = (position.x - vpt[4]) / vpt[0];
      const canvasY = (position.y - vpt[5]) / vpt[3];

      if (item.type === "shape") {
        const shapeType = item.data.shapeType as string;

        switch (shapeType) {
          case "circle":
            editor.addCircle();
            break;
          case "rectangle":
            editor.addRectangle();
            break;
          case "softRectangle":
            editor.addSoftRectangle();
            break;
          case "triangle":
            editor.addTriangle();
            break;
          case "inverseTriangle":
            editor.addInverseTriangle();
            break;
          case "diamond":
            editor.addDiamond();
            break;
        }

        // move the newly added shape to drop position
        const objects = canvas.getObjects();
        const lastObject = objects[objects.length - 1];
        if (lastObject && lastObject.name !== "clip") {
          lastObject.set({
            left: canvasX - (lastObject.width || 0) / 2,
            top: canvasY - (lastObject.height || 0) / 2,
          });
          lastObject.setCoords();
          canvas.setActiveObject(lastObject);
          canvas.requestRenderAll();
        }
      }

      if (item.type === "text") {
        const textType = item.data.textType as string;
        const textOptions = item.data.options || {};

        editor.addText(textOptions.text || "Text", {
          ...textOptions,
          left: canvasX,
          top: canvasY,
        });

        const objects = canvas.getObjects();
        const lastObject = objects[objects.length - 1];
        if (lastObject && lastObject.name !== "clip") {
          canvas.setActiveObject(lastObject);
          canvas.requestRenderAll();
        }
      }

      if (item.type === "image") {
        const imageUrl = item.data.url as string;
        if (imageUrl) {
          // store reference to current canvas
          const currentCanvas = canvas;

          // preload image using html Image element first
          const htmlImg = new Image();
          htmlImg.crossOrigin = "anonymous";

          htmlImg.onload = () => {
            // create fabric image from loaded html image
            const fabricImg = new fabric.Image(htmlImg, {
              left: 0,
              top: 0,
            });

            // scale image to reasonable size
            const maxSize = 300;
            const scale = Math.min(
              maxSize / (fabricImg.width || 1),
              maxSize / (fabricImg.height || 1),
              1,
            );
            fabricImg.scale(scale);

            // position at drop location
            const scaledWidth = (fabricImg.width || 0) * scale;
            const scaledHeight = (fabricImg.height || 0) * scale;
            fabricImg.set({
              left: canvasX - scaledWidth / 2,
              top: canvasY - scaledHeight / 2,
            });

            // add to canvas
            currentCanvas.add(fabricImg);
            fabricImg.setCoords();
            currentCanvas.setActiveObject(fabricImg);

            // force multiple render calls to ensure visibility
            currentCanvas.renderAll();
            requestAnimationFrame(() => {
              currentCanvas.requestRenderAll();
            });
          };

          htmlImg.onerror = () => {
            console.error("Failed to load image:", imageUrl);
          };

          // start loading
          htmlImg.src = imageUrl;
        }
      }
    },
    [editor],
  );

  // register drop handler
  useEffect(() => {
    setOnDropRef.current(handleDrop);
    return () => setOnDropRef.current(null);
  }, [handleDrop]);

  //@ts-ignore
  const { debouncedSave, saveState, saveThumbnail } = useAutoSave(editor);

  // capture thumbnail before user leaves
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (editor?.canvas) {
        saveThumbnail();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // save thumbnail on unmount
      if (editor?.canvas) {
        saveThumbnail();
      }
    };
  }, [editor, saveThumbnail]);

  useCanvasEvents({
    canvas: editor?.canvas || null,
    save: debouncedSave,
    setSelectedObjects: setSelectedObjects,
    clearSelection: onClearSelection,
    onModified: () => setUnsavedChanges(true),
  });

  const onChangeActiveTool = useCallback(
    (tool: ActiveTool) => {
      if (tool === activeTool) {
        return setActiveTool("select");
      }

      if (tool == "draw") {
        editor?.enableDrawingMode();
      }
      if (activeTool == "draw") {
        editor?.disableDrawingMode();
      }

      setActiveTool(tool);
    },
    [activeTool, editor],
  );

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    canvasRef.current.width = project?.width || 500;
    canvasRef.current.height = project?.height || 500;

    const canvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: "transparent",
      preserveObjectStacking: true,
      selection: true,
      controlsAboveOverlay: true,
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
    });

    init({
      initialCanvas: canvas,
      initialContainer: containerRef.current,
    });

    if (project?.json) {
      try {
        const jsonData =
          typeof project.json === "string"
            ? JSON.parse(project.json)
            : project.json;

        canvas.loadFromJSON(jsonData, () => {
          const workspace = canvas
            .getObjects()
            .find((obj) => obj.name === "clip");
          if (!workspace) {
            const workspaceObj = new fabric.Rect({
              width: project?.width || 500,
              height: project?.height || 500,
              name: "clip",
              fill: "white",
              selectable: false,
              hasControls: false,
              shadow: new fabric.Shadow({
                color: "rgba(0, 0, 0, 0.1)",
                blur: 5,
                offsetX: 0,
                offsetY: 2,
              }),
            });
            canvas.add(workspaceObj);
            canvas.centerObject(workspaceObj);

            if (containerRef.current) {
              const containerRect =
                containerRef.current.getBoundingClientRect();
              const workspaceCenter = workspaceObj.getCenterPoint();
              const containerCenter = new fabric.Point(
                containerRect.width / 2,
                containerRect.height / 2,
              );

              const vpt = [
                1,
                0,
                0,
                1,
                containerCenter.x - workspaceCenter.x,
                containerCenter.y - workspaceCenter.y,
              ];

              canvas.setViewportTransform(vpt);
              canvas.requestRenderAll();
            }
          }
          canvas.renderAll();
        });
      } catch (error) {
        console.error("Failed to load project data:", error);
      }
    }

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      if (!containerRef.current) return;

      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const containerWidth = containerRef.current!.offsetWidth;
        const containerHeight = containerRef.current!.offsetHeight;

        canvas.setDimensions({
          width: containerWidth,
          height: containerHeight,
        });

        canvas.renderAll();
      }, 100);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      handleResize();
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
      clearTimeout(resizeTimeout);
      canvas.dispose();
    };
  }, [init, project]);

  if (isProjectLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LucideLoader2 className="animate-spin" />
      </div>
    );
  }

  if (projectError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Error loading project: {projectError.message}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen w-screen flex-col overflow-hidden">
        <Navbar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
          saveState={saveState}
        />
        <div className="relative flex w-full flex-1 overflow-hidden">
          <Sidebar
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
          />
          <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
            <div
              className="canvas-container absolute inset-0 overflow-hidden"
              ref={containerRef}
              style={{
                touchAction: "none",
                userSelect: "none",
              }}
            >
              {!editor && <CanvasSkeleton />}
              <canvas ref={canvasRef} className="absolute inset-0" />
              <div className="pointer-events-auto absolute right-4 bottom-4 z-10">
                <ZoomControls editor={editor} />
              </div>
              <CanvasDropZone />
            </div>
            <Toolbar
              editor={editor}
              activeTool={activeTool}
              onChangeActiveTool={onChangeActiveTool}
            />
          </main>
          <DesignSidebar
            editor={editor}
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
          />
          <ShapeSidebar
            editor={editor}
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
          />
          <FillColorSidebar
            editor={editor}
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
          />
          <StrokeColorSidebar
            editor={editor}
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
          />
          <AISidebar
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
          />
          <DrawSidebar
            editor={editor}
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
          />
          <ImageSidebar
            editor={editor}
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
          />
          <SettingsSidebar
            editor={editor}
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
          />
          <TextSidebar
            editor={editor}
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
          />
          <FontSidebar
            editor={editor}
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
          />

          <AgentPanel
            editor={editor}
            isOpen={isAgentPanelOpen}
            onToggle={() => setIsAgentPanelOpen(!isAgentPanelOpen)}
          />
        </div>
      </div>

      {/* drag preview */}
      <DragPreview
        item={dragState.item}
        position={dragState.position}
        isOverCanvas={dragState.isOverCanvas}
        isDragging={dragState.isDragging}
      />
    </>
  );
}

export default function Editor() {
  return (
    <AuthGuard>
      <DragProvider>
        <EditorContent />
      </DragProvider>
    </AuthGuard>
  );
}
