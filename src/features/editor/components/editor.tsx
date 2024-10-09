"use client";

import React, { useEffect, useRef } from "react";
import { useEditor } from "~/hooks/useEditor";

const Editor = () => {
  const { init } = useEditor();

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  useEffect(() => {
    init({
      initialCanvas: canvasRef.current,
      initialContainer: containerRef.current!,
    });
  }, [init]);

  return (
    <div ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default Editor;
