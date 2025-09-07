"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { useEditor } from "~/hooks/useEditor";
import { fabric } from "fabric";
import { Navbar } from "~/components/editor/navbar";
import { Toolbar } from "~/components/editor/toolbar";
import { Footer } from "~/components/editor/footer";
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

export default function Editor() {
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

  const onClearSelection = useCallback(() => {
    if (selectionDependentTool.includes(activeTool)) {
      setActiveTool("select");
    }
  }, [activeTool]);

  const { init, editor } = useEditor({
    clearSelection: onClearSelection,
    onModified: () => setUnsavedChanges(true),
  });

  //@ts-ignore
  const { debouncedSave, saveState } = useAutoSave(editor);

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
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      selection: true,
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
            canvas.clipPath = workspaceObj;

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
    <AuthGuard>
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
          <main className="relative flex w-full flex-1 flex-col overflow-hidden">
            <div
              className="canvas-container absolute inset-0"
              ref={containerRef}
              style={{
                scrollBehavior: "smooth",
                overscrollBehavior: "contain",
                WebkitOverflowScrolling: "touch",
                position: "relative",
                width: "100%",
                height: "100%",
                maxHeight: "100%",
                minHeight: "0",
                overflow: "visible",
                overscrollBehaviorX: "contain",
                overscrollBehaviorY: "contain",
              }}
            >
              <div
                className="canvas-scroll-wrapper absolute inset-0"
                style={{
                  overflowX: "auto",
                  overflowY: "auto",
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(0, 0, 0, 0.3) transparent",
                }}
              >
                <canvas
                  ref={canvasRef}
                  style={{
                    margin: "0",
                  }}
                />
              </div>
              <div className="absolute right-4 bottom-4 z-10">
                <ZoomControls editor={editor} />
              </div>
            </div>
            <Toolbar
              editor={editor}
              activeTool={activeTool}
              onChangeActiveTool={onChangeActiveTool}
            />
            {/* <Footer editor={editor} /> */}
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
        </div>
      </div>
    </AuthGuard>
  );
}
