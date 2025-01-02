"use client";

import { useCallback, useMemo, useState } from "react";
import { fabric } from "fabric";
import { useAutoResize } from "./useAutoResize";
import {
  CIRCLE_OPTIONS,
  FILL_COLOR,
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  RECTANGLE_OPTIONS,
  STROKE_COLOR,
  STROKE_WIDTH,
  TEXT_OPTIONS,
  TRIANGLE_OPTIONS,
  UseEditorProps,
} from "~/components/editor/types";
import { useCanvasEvents } from "./useCanvasEvents";
import { isText } from "~/lib/utils";
import { ITextboxOptions } from "fabric/fabric-impl";

const WORKSPACE_WIDTH = 900;
const WORKSPACE_HEIGHT = 1200;

const getWorkspace = (canvas: fabric.Canvas) => {
  return canvas.getObjects().find((object) => object.name === "clip");
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
  const [strokeType, setStrokeType] = useState<"solid" | "dashed">("solid");
  const [fontFamily, setFontFamily] = useState(FONT_FAMILY);

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
    if (!canvas) return undefined;

    const center = (object: fabric.Object) => {
      canvas.centerObject(object);
      canvas.renderAll();
    };

    const addObject = (object: fabric.Object) => {
      canvas.add(object);
      center(object);
      canvas.setActiveObject(object);
      canvas.requestRenderAll();
    };

    const createBasicShape = (ShapeClass: any, options: any) => {
      const object = new ShapeClass({
        ...options,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
      });
      addObject(object);
    };

    return {
      canvas,
      fillColor,
      strokeColor,
      strokeWidth,
      strokeType,
      fontFamily,
      setFontFamily,

      bringForward: () => {
        canvas.getActiveObjects().forEach((object) => {
          canvas.bringForward(object);
        });
        canvas.renderAll();
        const workspace = getWorkspace(canvas);
        workspace?.sendToBack();
      },

      sendBackward: () => {
        canvas.getActiveObjects().forEach((object) => {
          canvas.sendBackwards(object);
        });
        canvas.renderAll();
        const workspace = getWorkspace(canvas);
        workspace?.sendToBack();
      },

      delete: () => {
        canvas.getActiveObjects().forEach((object) => canvas.remove(object));
        canvas.discardActiveObject();
        canvas.renderAll();
      },

      addCircle: () => createBasicShape(fabric.Circle, CIRCLE_OPTIONS),
      addRectangle: () => createBasicShape(fabric.Rect, RECTANGLE_OPTIONS),
      addSoftRectangle: () =>
        createBasicShape(fabric.Rect, {
          ...RECTANGLE_OPTIONS,
          rx: 50,
          ry: 50,
        }),
      addTriangle: () => createBasicShape(fabric.Triangle, TRIANGLE_OPTIONS),
      addDiamond: () =>
        createBasicShape(fabric.Rect, {
          ...RECTANGLE_OPTIONS,
          width: 200,
          height: 200,
          angle: 45,
          rx: 30,
          ry: 30,
        }),
      addInverseTriangle: () => {
        const triangle = new fabric.Triangle({
          ...TRIANGLE_OPTIONS,
          angle: 180,
          width: 200,
          height: 200,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
        });
        addObject(triangle);
      },
      addText: (value: string, options?: ITextboxOptions) => {
        const text = new fabric.Textbox(value, {
          ...TEXT_OPTIONS,
          ...options,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: 0,
          fontSize: options?.fontSize || FONT_SIZE,
        });
        addObject(text);
      },
      getActiveFillColor: () => {
        const activeObject = canvas.getActiveObject();
        return activeObject ? activeObject.get("fill") : fillColor;
      },
      getActiveStrokeColor: () => {
        const activeObject = canvas.getActiveObject();
        return activeObject
          ? isText(activeObject.type)
            ? activeObject.get("fill")
            : activeObject.get("stroke")
          : strokeColor;
      },
      getActiveOpacity: () => {
        const activeObject = canvas.getActiveObject();
        return activeObject ? activeObject.get("opacity") : 1;
      },
      getActiveStrokeWidth: () => {
        const activeObject = canvas.getActiveObject();
        return activeObject ? activeObject.get("strokeWidth") : strokeWidth;
      },
      getActiveFontWeight: () => {
        const selectedObject = selectedObjects?.[0];

        if (!selectedObject) {
          return FONT_WEIGHT;
        }

        // @ts-ignore
        const value = selectedObject.get("fontWeight") || FONT_WEIGHT;

        return value;
      },
      getActiveFontFamily: () => {
        const selectedObject = selectedObjects?.[0];

        if (!selectedObject) {
          return fontFamily;
        }

        // @ts-ignore
        const value = selectedObject.get("fontFamily") || fontFamily;

        return value;
      },

      changeFillColor: (value: string) => {
        setFillColor(value);
        canvas.getActiveObjects().forEach((obj) => obj.set({ fill: value }));
        canvas.renderAll();
      },
      changeStrokeColor: (value: string) => {
        setStrokeColor(value);
        canvas.getActiveObjects().forEach((object) => {
          if (isText(object.type)) {
            object.set({ fill: value });
          } else {
            object.set({ stroke: value });
          }
        });
        canvas.requestRenderAll();
      },
      changeStrokeWidth: (value: number) => {
        setStrokeWidth(value);
        canvas.getActiveObjects().forEach((object) => {
          object.set({ strokeWidth: value });
        });
        canvas.renderAll();
      },
      changeOpacity: (value: number) => {
        canvas.getActiveObjects().forEach((object) => {
          object.set({ opacity: value });
        });
        canvas.renderAll();
      },

      changeStrokeType: (type: "solid" | "dashed") => {
        setStrokeType(type);
        canvas.getActiveObjects().forEach((object) => {
          if (type === "dashed") {
            object.set({ strokeDashArray: [10, 10] });
          } else {
            object.set({ strokeDashArray: undefined });
          }
        });
        canvas.renderAll();
      },

      changeFontFamily: (value: string) => {
        setFontFamily(value);
        canvas.getActiveObjects().forEach((object) => {
          if (isText(object.type)) {
            // @ts-ignore
            object.set({ fontFamily: value });
          }
        });
        canvas.renderAll();
      },

      //text tools
      changeFontSize: (value: number) => {
        canvas.getActiveObjects().forEach((object) => {
          if (isText(object.type)) {
            // @ts-ignore
            object.set({ fontSize: value });
          }
        });
        canvas.renderAll();
      },
      getActiveFontSize: () => {
        const selectedObject = selectedObjects?.[0];

        if (!selectedObject) {
          return FONT_SIZE;
        }

        // @ts-ignore
        const value = selectedObject.get("fontSize") || FONT_SIZE;

        return value;
      },
      changeTextAlign: (value: string) => {
        canvas.getActiveObjects().forEach((object) => {
          if (isText(object.type)) {
            // @ts-ignore
            object.set({ textAlign: value });
          }
        });
        canvas.renderAll();
      },
      getActiveTextAlign: () => {
        const selectedObject = selectedObjects?.[0];

        if (!selectedObject) {
          return "left";
        }

        // @ts-ignore
        const value = selectedObject.get("textAlign") || "left";

        return value;
      },
      changeFontUnderline: (value: boolean) => {
        canvas.getActiveObjects().forEach((object) => {
          if (isText(object.type)) {
            // @ts-ignore
            // Faulty TS library, underline exists.
            object.set({ underline: value });
          }
        });
        canvas.renderAll();
      },
      getActiveFontUnderline: () => {
        const selectedObject = selectedObjects?.[0];

        if (!selectedObject) {
          return false;
        }

        // @ts-ignore
        const value = selectedObject.get("underline") || false;

        return value;
      },
      changeFontLinethrough: (value: boolean) => {
        canvas.getActiveObjects().forEach((object) => {
          if (isText(object.type)) {
            // @ts-ignore
            object.set({ linethrough: value });
          }
        });
        canvas.renderAll();
      },
      getActiveFontLinethrough: () => {
        const selectedObject = selectedObjects?.[0];

        if (!selectedObject) {
          return false;
        }

        // @ts-ignore
        const value = selectedObject.get("linethrough") || false;

        return value;
      },
      changeFontStyle: (value: string) => {
        canvas.getActiveObjects().forEach((object) => {
          if (isText(object.type)) {
            // @ts-ignore
            object.set({ fontStyle: value });
          }
        });
        canvas.renderAll();
      },
      getActiveFontStyle: () => {
        const selectedObject = selectedObjects?.[0];

        if (!selectedObject) {
          return "normal";
        }

        // @ts-ignore
        const value = selectedObject.get("fontStyle") || "normal";

        return value;
      },
      changeFontWeight: (value: number) => {
        canvas.getActiveObjects().forEach((object) => {
          if (isText(object.type)) {
            // @ts-ignore
            object.set({ fontWeight: value });
          }
        });
        canvas.renderAll();
      },
    };
  }, [
    canvas,
    fillColor,
    strokeColor,
    strokeWidth,
    strokeType,
    fontFamily,
    selectedObjects,
  ]);

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
