"use client";

import React, { useEffect, useRef, useState } from "react";
import { useEditor } from "~/hooks/useEditor";
import { fabric } from "fabric";

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
    <div
      className="bg-secondary flex h-full items-center justify-center"
      ref={containerRef}
    >
      <canvas ref={canvasRef} className="" />
    </div>
  );
};

export default Editor;
