"use client";

import { useCallback, useMemo, useState } from "react";
import { fabric } from "fabric";
import { useAutoResize } from "./useAutoResize";
import {
  CIRCLE_OPTIONS,
  EditorProps,
  FILL_COLOR,
  RECTANGLE_OPTIONS,
  STROKE_COLOR,
  STROKE_WIDTH,
  TRIANGLE_OPTIONS,
  UseEditorProps,
} from "~/components/editor/types";
import { useCanvasEvents } from "./useCanvasEvents";
import { isText } from "~/lib/utils";

const WORKSPACE_WIDTH = 900;
const WORKSPACE_HEIGHT = 1200;

const buildEditor = ({
  canvas,
  fillColor,
  strokeColor,
  strokeWidth,
  setFillColor,
  setStrokeColor,
  setStrokeWidth,
  selectedObjects,
  getActiveFillColor,
  getActiveStrokeColor,
  changeFillColor,
}: EditorProps) => {
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
    fillColor,
    strokeColor,
    strokeWidth,
    changeFillColor,
    changeStrokeColor: (value: string) => {
      setStrokeColor(value);
      canvas.getActiveObjects().forEach((object) => {
        if (isText(object.type)) {
          object.set({ fill: value });
        } else {
          object.set({ stroke: value });
        }
      });
      canvas.renderAll();
    },
    changeStrokeWidth: (value: number) => {
      setStrokeWidth(value);
      canvas.getActiveObjects().forEach((object) => {
        object.set({ strokeWidth: value });
      });
      canvas.renderAll();
    },
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
    canvas,
    getActiveFillColor,
    getActiveStrokeColor,
  };
};

export const useEditor = ({ clearSelection }: UseEditorProps) => {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  const [selectedObjects, setSelectedObjects] = useState<
    fabric.Object[] | null
  >(null);

  const [fillColor, setFillColor] = useState(FILL_COLOR);
  const [strokeColor, setStrokeColor] = useState(STROKE_COLOR);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTH);

  useAutoResize({
    canvas,
    container,
  });

  useCanvasEvents({
    canvas,
    setSelectedObjects,
    clearSelection,
  });

  const editor = useMemo(() => {
    if (canvas) {
      const getActiveFillColor = () => {
        const selectedObject = selectedObjects?.[0];
        if (!selectedObject) {
          return fillColor;
        }
        return selectedObject.get("fill") || fillColor;
      };

      const getActiveStrokeColor = () => {
        const selectedObject = selectedObjects?.[0];
        if (!selectedObject) {
          return strokeColor;
        }
        return selectedObject.get("stroke") || strokeColor;
      };

      const changeFillColor = (value: string) => {
        setFillColor(value);
        canvas.getActiveObjects().forEach((object) => {
          object.set({ fill: value });
        });
        canvas.renderAll();
      };

      return buildEditor({
        canvas,
        fillColor,
        strokeColor,
        strokeWidth,
        setFillColor,
        setStrokeColor,
        setStrokeWidth,
        selectedObjects,
        getActiveFillColor,
        getActiveStrokeColor,
        changeFillColor,
      });
    }
    return undefined;
  }, [canvas, fillColor, strokeColor, strokeWidth, selectedObjects]);

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
