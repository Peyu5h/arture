"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { fabric } from "fabric";
import { useAutoResize } from "./useAutoResize";
import {
  CIRCLE_OPTIONS,
  FILL_COLOR,
  FONT_FAMILY,
  FONT_SIZE,
  FONT_WEIGHT,
  JSON_KEYS,
  RECTANGLE_OPTIONS,
  STROKE_COLOR,
  STROKE_WIDTH,
  TEXT_OPTIONS,
  TRIANGLE_OPTIONS,
  UseEditorProps,
} from "~/components/editor/types";
import { useCanvasEvents } from "./useCanvasEvents";
import { downloadFile, downloadPdf, isText, transformText } from "~/lib/utils";
import { ITextboxOptions } from "fabric/fabric-impl";
import { useClipboard } from "./useClipboard";
import { useHistory } from "./useHistory";
import { useShortcuts } from "./useShortcuts";

const WORKSPACE_WIDTH = 900;
const WORKSPACE_HEIGHT = 1200;

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

  const getWorkspace = useCallback(() => {
    return canvas?.getObjects().find((object) => object.name === "clip");
  }, [canvas]);

  const generateSaveOptions = () => {
    const { width, height, left, top } = getWorkspace() as fabric.Rect;

    return {
      name: "Image",
      format: "png",
      quality: 1,
      width,
      height,
      left,
      top,
    };
  };

  const savePng = () => {
    const options = generateSaveOptions();

    canvas?.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const dataUrl = canvas?.toDataURL(options);

    if (dataUrl) {
      downloadFile(dataUrl, "png");
    }
    autoZoom();
  };

  const savePdf = async () => {
    const options = generateSaveOptions();

    canvas?.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const dataUrl = canvas?.toDataURL(options);

    if (dataUrl) {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      downloadPdf(blob, "document");
    }
    autoZoom();
  };

  const saveSvg = () => {
    const options = generateSaveOptions();

    canvas?.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const dataUrl = canvas?.toDataURL(options);

    if (dataUrl) {
      downloadFile(dataUrl, "svg");
    }
    autoZoom();
  };

  const saveJpg = () => {
    const options = generateSaveOptions();

    canvas?.setViewportTransform([1, 0, 0, 1, 0, 0]);
    const dataUrl = canvas?.toDataURL(options);
    if (dataUrl) {
      downloadFile(dataUrl, "jpg");
    }
    autoZoom();
  };

  const saveJson = async () => {
    const dataUrl = canvas?.toJSON(JSON_KEYS);
    if (dataUrl) {
      await transformText(dataUrl.objects);
      const fileString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(dataUrl, null, "\t"),
      )}`;

      downloadFile(fileString, "json");
    }
  };

  const loadJson = (json: string) => {
    const data = JSON.parse(json);

    canvas?.loadFromJSON(data, () => {
      autoZoom();
    });
  };

  const { autoZoom } = useAutoResize({
    canvas,
    container,
  });

  const { copy, paste } = useClipboard({ canvas });
  const { save, canRedo, canUndo, undo, redo, canvasHistory, setHistoryIndex } =
    useHistory({ canvas });

  useCanvasEvents({
    canvas,
    setSelectedObjects,
    clearSelection,
    save,
  });

  useShortcuts({
    canvas,
    save,
    copy,
    paste,
    undo,
    redo,
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
        const workspace = getWorkspace();
        workspace?.sendToBack();
        save();
      },

      sendBackward: () => {
        canvas.getActiveObjects().forEach((object) => {
          canvas.sendBackwards(object);
        });
        canvas.renderAll();
        const workspace = getWorkspace();
        workspace?.sendToBack();
        save();
      },

      delete: () => {
        canvas.getActiveObjects().forEach((object) => canvas.remove(object));
        canvas.discardActiveObject();
        canvas.renderAll();
      },

      onCopy: () => copy(),
      onPaste: () => paste(),
      save: () => save(),
      undo: () => undo(),
      redo: () => redo(),

      onUndo: () => undo(),
      onRedo: () => redo(),

      canUndo: () => canUndo(),
      canRedo: () => canRedo(),

      zoomIn: () => {
        let zoomRatio = canvas?.getZoom() || 1;
        zoomRatio += 0.05;
        const center = canvas.getCenter();
        canvas.zoomToPoint(
          new fabric.Point(center.left, center.top),
          zoomRatio > 1 ? 1 : zoomRatio,
        );
        save();
      },

      zoomOut: () => {
        let zoomRatio = canvas?.getZoom() || 1;
        zoomRatio -= 0.05;
        const center = canvas.getCenter();
        canvas.zoomToPoint(
          new fabric.Point(center.left, center.top),
          zoomRatio < 0.2 ? 0.2 : zoomRatio,
        );
        save();
      },

      changeSize: (value: { width: number; height: number }) => {
        const workspace = getWorkspace();
        workspace?.set(value);
        autoZoom();
        save();
      },

      changeBackground: (value: string) => {
        const workspace = getWorkspace();
        workspace?.set({ fill: value });
        canvas.renderAll();
        save();
      },

      savePng,
      savePdf,
      saveSvg,
      saveJpg,
      saveJson,
      loadJson,

      enableDrawingMode: () => {
        canvas.discardActiveObject();
        canvas.renderAll();
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = fillColor;
        canvas.freeDrawingBrush.width = strokeWidth;
      },

      disableDrawingMode: () => {
        canvas.isDrawingMode = false;
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
        save();
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
        canvas.freeDrawingBrush.color = value;
        canvas.requestRenderAll();
        save();
      },
      changeStrokeWidth: (value: number) => {
        setStrokeWidth(value);
        canvas.getActiveObjects().forEach((object) => {
          object.set({ strokeWidth: value });
        });
        canvas.freeDrawingBrush.width = value;
        canvas.renderAll();
        save();
      },
      changeOpacity: (value: number) => {
        canvas.getActiveObjects().forEach((object) => {
          object.set({ opacity: value });
        });
        canvas.renderAll();
        save();
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
        save();
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
        save();
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
        save();
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
        save();
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
        save();
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
        save();
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
        save();
      },
      addImage: (value: string) => {
        fabric.Image.fromURL(
          value,
          (image) => {
            const workspace = getWorkspace();

            image.scaleToWidth(workspace?.width || 0);
            image.scaleToHeight(workspace?.height || 0);

            addObject(image);
          },
          {
            crossOrigin: "anonymous",
          },
        );
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
        save();
      },

      getWorkspace: () => getWorkspace(),
      autoZoom: () => autoZoom(),
    };
  }, [
    canvas,
    fillColor,
    strokeColor,
    strokeWidth,
    strokeType,
    fontFamily,
    selectedObjects,
    copy,
    paste,
    save,
    canRedo,
    canUndo,
    undo,
    redo,
    autoZoom,
    getWorkspace,
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

      // initialCanvas.renderAll();

      const currState = JSON.stringify(initialCanvas.toJSON(JSON_KEYS));

      canvasHistory.current = [currState];
      setHistoryIndex(0);
    },
    [canvasHistory, setHistoryIndex],
  );

  return {
    init,
    editor,
  };
};
