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

const Editor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    [activeTool],
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

  return (
    <div className="flex h-screen w-screen flex-col">
      <Navbar
        // @ts-ignore
        editor={editor}
        activeTool={activeTool}
        onChangeActiveTool={onChangeActiveTool}
      />
      <div className="relative flex h-full w-full overflow-hidden">
        <Sidebar
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <ShapeSidebar
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <FillColorSidebar
          // @ts-ignore
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <StrokeColorSidebar
          // @ts-ignore
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <AISidebar
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />

        <DrawSidebar
          // @ts-ignore
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <ImageSidebar
          // @ts-ignore
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <SettingsSidebar
          // @ts-ignore
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <TextSidebar
          // @ts-ignore
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <FontSidebar
          // @ts-ignore
          editor={editor}
          activeTool={activeTool}
          onChangeActiveTool={onChangeActiveTool}
        />
        <main className="flex w-full flex-1 flex-col overflow-auto bg-secondary">
          <Toolbar
            // @ts-ignore
            editor={editor}
            activeTool={activeTool}
            onChangeActiveTool={onChangeActiveTool}
          />
          <div className="canvas-container" ref={containerRef}>
            <canvas ref={canvasRef} />
          </div>
          <Footer
            // @ts-ignore
            editor={editor}
          />
        </main>
      </div>
    </div>
  );
};

export default Editor;
