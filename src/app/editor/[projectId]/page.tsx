"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import { useEditor } from "~/hooks/useEditor";
import { fabric } from "fabric";
import { Navbar } from "~/components/editor/navbar";
import { Toolbar } from "~/components/editor/toolbar";
import { Sidebar } from "~/components/editor/sidebar/sidebar";
import { ActiveTool, selectionDependentTool } from "~/lib/types";
import { ShapeSidebar } from "~/components/editor/sidebar/shapes/shape-sidebar";
import { FillColorSidebar } from "~/components/editor/sidebar/fillColor/fillColorSidebar";
import { StrokeColorSidebar } from "~/components/editor/sidebar/fillColor/strokeColorSidebar";
import { DrawSidebar } from "~/components/editor/sidebar/draw/draw-sidebar";
import { TextSidebar } from "~/components/editor/sidebar/text/text-sidebar";
import { FontSidebar } from "~/components/editor/sidebar/text/font-sidebar";
import { TemplatesSidebar } from "~/components/editor/sidebar/templates/templates-sidebar";
import { ElementsSidebar } from "~/components/editor/sidebar/elements/elements-sidebar";
import {
  UploadsSidebar,
  UploadedImage,
} from "~/components/editor/sidebar/uploads/uploads-sidebar";

// get uploads from localStorage
const getStoredUploads = (projectId?: string): UploadedImage[] => {
  if (typeof window === "undefined") return [];
  try {
    const key = projectId ? `arture-uploads-${projectId}` : "arture-uploads";
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};
import { ImagesSidebar } from "~/components/editor/sidebar/images/images-sidebar";
import { ZoomControls } from "~/components/editor/zoom-controls";
import { useParams } from "next/navigation";
import { useProject } from "~/hooks/projects.hooks";

import { useAutoSave } from "~/hooks/useAutoSave";
import { useCanvasEvents } from "~/hooks/useCanvasEvents";
import { AuthGuard } from "~/components/auth-guard";
import {
  CanvasSkeleton,
  EditorSkeleton,
} from "~/components/editor/canvas-skeleton";
import { AgentPanel, CanvasGhostOverlay } from "~/components/editor/agent";
import {
  DragProvider,
  useDragContext,
  DragItem,
} from "~/contexts/drag-context";
import { DragPreview } from "~/components/editor/drag-preview";
import { CanvasDropZone } from "~/components/editor/canvas-drop-zone";
import { ImageToolsDialog } from "~/components/editor/image-tools/image-tools-dialog";
import { ImageEditorOverlay } from "~/components/editor/image-tools/image-editor-overlay";
import { useImageTools } from "~/hooks/useImageTools";
import { SvgEditorDialog } from "~/components/editor/svg-editor/svg-editor-dialog";
import { PresenceAvatars } from "~/components/editor/presence-avatars";
import { AuthPromptDialog } from "~/components/editor/auth-prompt-dialog";
import { authClient } from "~/lib/auth-client";

function EditorContent() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const projectId = useParams().projectId;
  const {
    data: project,
    isLoading: isProjectLoading,
    error: projectError,
  } = useProject(`${projectId}`);

  const searchParams = useSearchParams();
  const shareToken = searchParams.get("share");

  const [activeTool, setActiveTool] = React.useState<ActiveTool>("select");
  const [unsavedChanges, setUnsavedChanges] = React.useState(false);
  const [selectedObjects, setSelectedObjects] = React.useState<
    fabric.Object[] | null
  >(null);
  const [isAgentPanelOpen, setIsAgentPanelOpen] = useState(true);
  const [viewMode, setViewMode] = useState<"editing" | "viewOnly">("editing");
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session?.user;

  // set initial view mode based on share permission
  useEffect(() => {
    if (project && (project as any).isShared) {
      if ((project as any).permission === "VIEW") {
        setViewMode("viewOnly");
      } else if ((project as any).permission === "EDIT") {
        if (!isLoggedIn) {
          setViewMode("viewOnly");
          setShowAuthPrompt(true);
        } else {
          setViewMode("editing");
        }
      }
    }
  }, [project, isLoggedIn]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(() =>
    getStoredUploads(projectId as string),
  );
  const [svgEditorOpen, setSvgEditorOpen] = useState(false);
  const [selectedSvgGroup, setSelectedSvgGroup] = useState<fabric.Group | null>(
    null,
  );

  // determine if view only based on share token permission
  const isViewOnly = useMemo(() => {
    if (viewMode === "viewOnly") return true;
    if (
      project &&
      (project as any).isShared &&
      (project as any).permission === "VIEW"
    ) {
      return true;
    }
    return false;
  }, [viewMode, project]);

  const handleViewModeChange = useCallback(
    (mode: "editing" | "viewOnly") => {
      // if trying to switch to editing but not logged in on a shared editable project
      if (
        mode === "editing" &&
        !isLoggedIn &&
        project &&
        (project as any).isShared &&
        (project as any).permission === "EDIT"
      ) {
        setShowAuthPrompt(true);
        return;
      }
      setViewMode(mode);
    },
    [isLoggedIn, project],
  );

  const { dragState, setOnDrop, setWorkspaceBounds } = useDragContext();
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

  // apply view mode to canvas
  useEffect(() => {
    if (!editor?.canvas) return;

    const canvas = editor.canvas;
    if (isViewOnly) {
      canvas.selection = false;
      canvas.forEachObject((obj) => {
        if (obj.name !== "clip") {
          obj.selectable = false;
          obj.evented = false;
        }
      });
    } else {
      canvas.selection = true;
      canvas.forEachObject((obj) => {
        if (obj.name !== "clip") {
          obj.selectable = true;
          obj.evented = true;
        }
      });
    }
    canvas.renderAll();
  }, [isViewOnly, editor?.canvas]);

  // svg editor event listener
  useEffect(() => {
    const handleOpenSvgEditor = (
      e: CustomEvent<{ svgGroup: fabric.Group }>,
    ) => {
      setSelectedSvgGroup(e.detail.svgGroup);
      setSvgEditorOpen(true);
    };

    window.addEventListener(
      "open-svg-editor",
      handleOpenSvgEditor as EventListener,
    );
    return () =>
      window.removeEventListener(
        "open-svg-editor",
        handleOpenSvgEditor as EventListener,
      );
  }, []);

  // Initialize image tools with double-tap detection
  const {
    isDialogOpen,
    selectedImage,
    openImageTools,
    closeImageTools,
    handleImageUpdate,
  } = useImageTools({
    canvas: editor?.canvas || null,
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
        const dropPosition = { left: canvasX, top: canvasY };

        switch (shapeType) {
          case "circle":
            editor.addCircle(dropPosition);
            break;
          case "rectangle":
            editor.addRectangle(dropPosition);
            break;
          case "softRectangle":
            editor.addSoftRectangle(dropPosition);
            break;
          case "triangle":
            editor.addTriangle(dropPosition);
            break;
          case "inverseTriangle":
            editor.addInverseTriangle(dropPosition);
            break;
          case "diamond":
            editor.addDiamond(dropPosition);
            break;
          case "pentagon":
            editor.addPentagon?.();
            break;
          case "hexagon":
            editor.addHexagon?.();
            break;
          case "octagon":
            editor.addOctagon?.();
            break;
          case "star":
            editor.addStar?.();
            break;
          case "heart":
            editor.addHeart?.();
            break;
          case "line":
            editor.addLine?.(dropPosition);
            break;
          case "arrow":
            editor.addArrow?.();
            break;
          case "doubleArrow":
            editor.addDoubleArrow?.();
            break;
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
          const currentCanvas = canvas;
          const isSvg =
            imageUrl.toLowerCase().includes(".svg") ||
            imageUrl.includes("/svg");

          if (isSvg) {
            // use proxy to bypass cors for r2 svgs
            const proxyUrl = `/api/proxy/svg?url=${encodeURIComponent(imageUrl)}`;
            fetch(proxyUrl)
              .then((res) => {
                if (!res.ok) throw new Error(`Proxy error: ${res.status}`);
                return res.text();
              })
              .then((svgText) => {
                fabric.loadSVGFromString(svgText, (objects, options) => {
                  if (!objects || objects.length === 0) {
                    console.error("Failed to parse SVG:", imageUrl);
                    return;
                  }

                  const svgGroup = fabric.util.groupSVGElements(
                    objects,
                    options,
                  );
                  svgGroup.set({
                    name: "svg-element",
                    selectable: true,
                    evented: true,
                    hasControls: true,
                  });

                  // scale to reasonable size
                  const maxSize = 300;
                  const scale = Math.min(
                    maxSize / (svgGroup.width || 1),
                    maxSize / (svgGroup.height || 1),
                    1,
                  );
                  svgGroup.scale(scale);

                  // position at drop location
                  const scaledWidth = (svgGroup.width || 0) * scale;
                  const scaledHeight = (svgGroup.height || 0) * scale;
                  svgGroup.set({
                    left: canvasX - scaledWidth / 2,
                    top: canvasY - scaledHeight / 2,
                  });

                  currentCanvas.add(svgGroup);
                  svgGroup.setCoords();
                  currentCanvas.setActiveObject(svgGroup);
                  currentCanvas.renderAll();
                });
              })
              .catch((err) => {
                console.error("Failed to fetch SVG:", imageUrl, err);
              });
          } else {
            // regular image loading
            const htmlImg = new Image();
            htmlImg.crossOrigin = "anonymous";

            htmlImg.onload = () => {
              const fabricImg = new fabric.Image(htmlImg, {
                left: 0,
                top: 0,
              });

              const maxSize = 300;
              const scale = Math.min(
                maxSize / (fabricImg.width || 1),
                maxSize / (fabricImg.height || 1),
                1,
              );
              fabricImg.scale(scale);

              const scaledWidth = (fabricImg.width || 0) * scale;
              const scaledHeight = (fabricImg.height || 0) * scale;
              fabricImg.set({
                left: canvasX - scaledWidth / 2,
                top: canvasY - scaledHeight / 2,
              });

              currentCanvas.add(fabricImg);
              fabricImg.setCoords();
              currentCanvas.setActiveObject(fabricImg);
              currentCanvas.renderAll();
            };

            htmlImg.onerror = () => {
              console.error("Failed to load image:", imageUrl);
            };

            htmlImg.src = imageUrl;
          }
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

  // track workspace bounds for drag highlighting - only when dragging
  const updateWorkspaceBounds = useCallback(() => {
    if (!editor?.canvas || !containerRef.current) return;

    const canvas = editor.canvas;
    const workspace = canvas.getObjects().find((obj) => obj.name === "clip");
    if (!workspace) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const zoom = canvas.getZoom();
    const vpt = canvas.viewportTransform;
    if (!vpt) return;

    const workspaceWidth = (workspace.width || 0) * zoom;
    const workspaceHeight = (workspace.height || 0) * zoom;
    const workspaceCenter = workspace.getCenterPoint();

    const screenX = workspaceCenter.x * zoom + vpt[4] + containerRect.left;
    const screenY = workspaceCenter.y * zoom + vpt[5] + containerRect.top;

    setWorkspaceBounds({
      left: screenX - workspaceWidth / 2,
      top: screenY - workspaceHeight / 2,
      width: workspaceWidth,
      height: workspaceHeight,
    });
  }, [editor, setWorkspaceBounds]);

  // only track bounds while dragging
  useEffect(() => {
    if (!dragState.isDragging) return;

    // update immediately when drag starts
    updateWorkspaceBounds();

    // continue updating during drag
    const handleUpdate = () => updateWorkspaceBounds();
    window.addEventListener("mousemove", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    return () => {
      window.removeEventListener("mousemove", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [dragState.isDragging, updateWorkspaceBounds]);

  //@ts-ignore
  const { debouncedSave, saveState, saveThumbnail } = useAutoSave(
    editor,
    isViewOnly,
  );

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
      // selection styling
      selectionColor: "rgba(59, 130, 246, 0.08)",
      selectionBorderColor: "#3b82f6",
      selectionLineWidth: 1,
      selectionDashArray: [5, 5],
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
          }

          // center workspace in viewport
          const centerWorkspace = () => {
            const ws = canvas.getObjects().find((obj) => obj.name === "clip");
            if (!ws || !containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            if (containerRect.width === 0 || containerRect.height === 0) return;

            const workspaceCenter = ws.getCenterPoint();
            const containerCenter = new fabric.Point(
              containerRect.width / 2,
              containerRect.height / 2,
            );

            const vpt: [number, number, number, number, number, number] = [
              1,
              0,
              0,
              1,
              containerCenter.x - workspaceCenter.x,
              containerCenter.y - workspaceCenter.y,
            ];

            canvas.setViewportTransform(vpt);
            canvas.requestRenderAll();
          };

          // fit workspace to screen with proper zoom
          const fitWorkspaceToScreen = () => {
            const ws = canvas.getObjects().find((obj) => obj.name === "clip");
            if (!ws || !containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            if (containerRect.width === 0 || containerRect.height === 0) return;

            const workspaceWidth = ws.width || 500;
            const workspaceHeight = ws.height || 500;

            // calculate zoom to fit with margin
            const margin = 100;
            const availableWidth = containerRect.width - margin * 2;
            const availableHeight = containerRect.height - margin * 2;

            const scaleX = availableWidth / workspaceWidth;
            const scaleY = availableHeight / workspaceHeight;
            const zoom = Math.min(scaleX, scaleY, 1);

            // set zoom and center
            const workspaceCenter = ws.getCenterPoint();
            const containerCenterX = containerRect.width / 2;
            const containerCenterY = containerRect.height / 2;

            const vpt: [number, number, number, number, number, number] = [
              zoom,
              0,
              0,
              zoom,
              containerCenterX - workspaceCenter.x * zoom,
              containerCenterY - workspaceCenter.y * zoom,
            ];

            canvas.setViewportTransform(vpt);
            canvas.requestRenderAll();
          };

          // fit immediately
          fitWorkspaceToScreen();

          // force render
          canvas.requestRenderAll();

          // refit after layout settles
          setTimeout(() => {
            fitWorkspaceToScreen();
            editor?.initializeHistory?.();
            canvas.requestRenderAll();
          }, 50);

          // final fit after everything loads
          setTimeout(() => {
            fitWorkspaceToScreen();
          }, 200);
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
    return <EditorSkeleton />;
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
          viewMode={isViewOnly ? "viewOnly" : "editing"}
          onViewModeChange={handleViewModeChange}
          isSharedView={
            !!(
              project &&
              (project as any).isShared &&
              (project as any).permission === "VIEW"
            )
          }
        />
        <div className="relative flex w-full flex-1 overflow-hidden">
          {!isViewOnly && (
            <Sidebar
              activeTool={activeTool}
              onChangeActiveTool={onChangeActiveTool}
            />
          )}
          <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
            <div
              className="canvas-container absolute inset-0 overflow-hidden"
              ref={containerRef}
              style={{
                touchAction: "none",
                userSelect: "none",
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                return false;
              }}
            >
              {!editor && <CanvasSkeleton />}
              <canvas ref={canvasRef} className="absolute inset-0" />
              <CanvasGhostOverlay
                canvas={editor?.canvas || null}
                containerRef={containerRef}
              />
              <div className="pointer-events-auto absolute right-4 bottom-4 z-10">
                <ZoomControls editor={editor} />
              </div>
              <CanvasDropZone />
            </div>
            {!isViewOnly && (
              <Toolbar
                editor={editor}
                activeTool={activeTool}
                onChangeActiveTool={onChangeActiveTool}
              />
            )}
          </main>
          {!isViewOnly && (
            <>
              <TemplatesSidebar
                editor={editor}
                activeTool={activeTool}
                onChangeActiveTool={onChangeActiveTool}
              />
              <ElementsSidebar
                editor={editor}
                activeTool={activeTool}
                onChangeActiveTool={onChangeActiveTool}
                uploadedImages={uploadedImages}
              />
              <UploadsSidebar
                editor={editor}
                activeTool={activeTool}
                onChangeActiveTool={onChangeActiveTool}
                projectId={projectId as string}
                onUploadsChange={setUploadedImages}
              />
              <ImagesSidebar
                editor={editor}
                activeTool={activeTool}
                onChangeActiveTool={onChangeActiveTool}
              />
              <TextSidebar
                editor={editor}
                activeTool={activeTool}
                onChangeActiveTool={onChangeActiveTool}
              />
              <ShapeSidebar
                editor={editor}
                activeTool={activeTool}
                onChangeActiveTool={onChangeActiveTool}
              />
              <DrawSidebar
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
              <FontSidebar
                editor={editor}
                activeTool={activeTool}
                onChangeActiveTool={onChangeActiveTool}
              />

              <AgentPanel
                editor={editor}
                isOpen={isAgentPanelOpen}
                onToggle={() => setIsAgentPanelOpen(!isAgentPanelOpen)}
                projectId={projectId as string}
              />
            </>
          )}
        </div>
      </div>

      {/* drag preview */}
      <DragPreview
        item={dragState.item}
        position={dragState.position}
        isOverCanvas={dragState.isOverCanvas}
        isDragging={dragState.isDragging}
      />

      {/* Image Editor Overlay - New sleek UI */}
      <ImageEditorOverlay
        isOpen={isDialogOpen}
        onClose={closeImageTools}
        imageElement={selectedImage}
        canvas={editor?.canvas || null}
        onImageUpdate={handleImageUpdate}
      />

      {/* SVG Editor Dialog */}
      <SvgEditorDialog
        isOpen={svgEditorOpen}
        onClose={() => {
          setSvgEditorOpen(false);
          setSelectedSvgGroup(null);
        }}
        svgGroup={selectedSvgGroup}
        canvas={editor?.canvas || null}
      />

      {/* Auth Prompt Dialog for non-logged users on editable shares */}
      <AuthPromptDialog
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        projectId={projectId as string}
        shareToken={shareToken || undefined}
      />
    </>
  );
}

export default function Editor() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <AuthGuard>
        <DragProvider>
          <EditorContent />
        </DragProvider>
      </AuthGuard>
    </Suspense>
  );
}
