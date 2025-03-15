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
import { useParams } from "next/navigation";
import { useProject } from "~/hooks/projects.hooks";
import { LucideLoader2 } from "lucide-react";

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

  const onClearSelection = useCallback(() => {
    if (selectionDependentTool.includes(activeTool)) {
      setActiveTool("select");
    }
  }, [activeTool]);

  const { init, editor } = useEditor({
    clearSelection: onClearSelection,
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

    const canvas = new fabric.Canvas(canvasRef.current, {
      controlsAboveOverlay: true,
      preserveObjectStacking: true,
    });

    init({
      initialCanvas: canvas,
      initialContainer: containerRef.current,
    });

    return () => {
      canvas.dispose();
    };
  }, [init]);

  // useEffect(() => {
  //   if (!canvasRef.current || !containerRef.current) return;

  //   const canvas = new fabric.Canvas(canvasRef.current, {
  //     controlsAboveOverlay: true,
  //     preserveObjectStacking: true,
  //   });

  //   init({
  //     initialCanvas: canvas,
  //     initialContainer: containerRef.current,
  //   });

  //   // Load project data after initialization
  //   if (project?.json) {
  //     try {
  //       const jsonData =
  //         typeof project.json === "string"
  //           ? JSON.parse(project.json)
  //           : project.json;
  //       canvas.loadFromJSON(jsonData, () => {
  //         if (project.width && project.height) {
  //           canvas.setDimensions({
  //             width: project.width,
  //             height: project.height,
  //           });
  //         }
  //         canvas.renderAll();
  //       });
  //     } catch (error) {
  //       console.error("Failed to load project data:", error);
  //     }
  //   }

  //   return () => {
  //     canvas.dispose();
  //   };
  // }, [init, project]);

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
    <div className="flex h-screen w-screen flex-col">
      <Navbar
        editor={editor}
        activeTool={activeTool}
        onChangeActiveTool={onChangeActiveTool}
      />
      <div className="relative flex h-full w-full overflow-hidden">
        <Sidebar
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
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
        <main className="flex w-full flex-1 flex-col overflow-auto bg-secondary">
          <Toolbar
            editor={editor}
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
          />
          <div className="canvas-container" ref={containerRef}>
            <canvas ref={canvasRef} />
          </div>
          <Footer editor={editor} />
        </main>
      </div>
    </div>
  );
}
