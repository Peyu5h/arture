"use client";

import React, { useEffect, useRef, useState } from "react";
import { useEditor } from "~/hooks/useEditor";
import { fabric } from "fabric";
import { Navbar } from "~/components/navbar";
import { Sidebar } from "~/components/sidebar";
import { Toolbar } from "~/components/toolbar";
import { Footer } from "~/components/footer";

const Editor = () => {
  const { init } = useEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div className="flex h-screen w-screen flex-col overflow-x-hidden">
      <Navbar />
      <div className="flex h-full w-full">
        <Sidebar />
        <main className="relative flex h-full w-full flex-1 flex-col overflow-auto bg-secondary">
          <Toolbar />
          <div className="canvas-container" ref={containerRef}>
            <canvas ref={canvasRef} />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default Editor;
