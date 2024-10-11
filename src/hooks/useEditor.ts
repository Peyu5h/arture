"use client";

import { useCallback, useMemo, useState } from "react";
import { fabric } from "fabric";
import { useAutoResize } from "./useAutoResize";
import {
  CIRCLE_OPTIONS,
  RECTANGLE_OPTIONS,
  TRIANGLE_OPTIONS,
} from "~/components/editor/types";

const WORKSPACE_WIDTH = 900;
const WORKSPACE_HEIGHT = 1200;

const buildEditor = ({ canvas }: { canvas: fabric.Canvas }) => {
  const getWorkspace = () => {
    return canvas.getObjects().find((object) => object.name === "clip");
  };

  const center = (object: fabric.Object) => {
    const workspace = getWorkspace();
    const center = workspace?.getCenterPoint();

    if (center) {
      // @ts-ignore
      canvas._centerObject(object, center);
    } else {
      canvas.centerObject(object);
    }
  };

  const addToCanvas = (object: fabric.Object) => {
    canvas.add(object);
    center(object);
    canvas.setActiveObject(object);
  };

  return {
    addCircle: () => {
      const object = new fabric.Circle({
        ...CIRCLE_OPTIONS,
      });
      addToCanvas(object);
    },

    addSoftRectangle: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        rx: 50,
        ry: 50,
      });
      addToCanvas(object);
    },

    addRectangle: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
      });
      addToCanvas(object);
    },

    addTriangle: () => {
      const object = new fabric.Triangle({
        ...TRIANGLE_OPTIONS,
      });
      addToCanvas(object);
    },

    addInverseTriangle: () => {
      const HEIGHT = 400;
      const WIDTH = 400;
      const object = new fabric.Polygon(
        [
          { x: 0, y: 0 },
          { x: WIDTH, y: 0 },
          { x: WIDTH / 2, y: HEIGHT },
        ],
        {
          ...TRIANGLE_OPTIONS,
        },
      );

      addToCanvas(object);
    },

    addDiamond: () => {
      const object = new fabric.Rect({
        ...RECTANGLE_OPTIONS,
        angle: 45,
        rx: 30,
        ry: 30,
      });
      addToCanvas(object);
    },
  };
};

export const useEditor = () => {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useAutoResize({
    canvas,
    container,
  });

  const editor = useMemo(() => {
    if (canvas) {
      return buildEditor({ canvas });
    }
    return undefined;
  }, [canvas]);

  const init = useCallback(
    ({
      initialCanvas,
      initialContainer,
    }: {
      initialCanvas: fabric.Canvas;
      initialContainer: HTMLDivElement;
    }) => {
      fabric.Object.prototype.set({
        cornerColor: "#FFF",
        cornerStyle: "circle",
        borderColor: "#3b82f6",
        borderScaleFactor: 1.5,
        borderOpacityWhenMoving: 1,
        transparentCorners: false,
        cornerStrokeColor: "#3b82f6",
      });

      const initialWorkspace = new fabric.Rect({
        width: WORKSPACE_WIDTH,
        height: WORKSPACE_HEIGHT,
        name: "clip",
        fill: "white",
        selectable: false,
        hasControls: false,
        shadow: new fabric.Shadow({
          color: "rgba(0, 0, 0, 0.8)",
          blur: 5,
        }),
      });

      initialCanvas.setHeight(initialContainer.offsetHeight);
      initialCanvas.setWidth(initialContainer.offsetWidth);

      initialCanvas.add(initialWorkspace);
      initialCanvas.centerObject(initialWorkspace);
      initialCanvas.clipPath = initialWorkspace;

      setCanvas(initialCanvas);
      setContainer(initialContainer);

      const test = new fabric.Rect({
        height: 100,
        width: 100,
        fill: "black",
      });
      initialCanvas.add(test);
      initialCanvas.centerObject(test);

      initialCanvas.renderAll();
    },
    [],
  );

  return {
    init,
    editor,
  };
};
