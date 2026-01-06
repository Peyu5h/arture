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
} from "~/lib/types";
import { useCanvasEvents } from "./useCanvasEvents";
import { downloadFile, downloadPdf, isText, transformText } from "~/lib/utils";
import { ITextboxOptions } from "fabric/fabric-impl";
import { useClipboard } from "./useClipboard";
import { useHistory } from "./useHistory";
import { useShortcuts } from "./useShortcuts";
import { useAdvancedZoom } from "./useAdvancedZoom";

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

  const getWorkspace = useCallback((): fabric.Rect | null => {
    const workspace = canvas
      ?.getObjects()
      .find((object) => object.name === "clip");
    return (workspace as fabric.Rect) || null;
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
  const {
    save,
    canRedo,
    canUndo,
    undo,
    redo,
    canvasHistory,
    setHistoryIndex,
    initializeHistory,
  } = useHistory({ canvas });

  const {
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    centerWorkspace,
    getCurrentZoom,
    isWorkspaceVisible,
    minZoom,
    maxZoom,
  } = useAdvancedZoom({
    canvas,
    container,
    minZoom: 0.1,
    maxZoom: 5,
    margin: 90,
  });

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
    zoomIn,
    zoomOut,
    resetZoom,
  });

  const editor = useMemo(() => {
    if (!canvas) return undefined;

    const center = (object: fabric.Object) => {
      canvas.centerObject(object);
      canvas.renderAll();
    };

    const addObject = (object: fabric.Object, skipCenter = false) => {
      canvas.add(object);
      if (!skipCenter) {
        center(object);
      }
      canvas.setActiveObject(object);
      canvas.requestRenderAll();
    };

    const createBasicShape = (
      ShapeClass: any,
      options: any,
      position?: { left: number; top: number },
    ) => {
      const object = new ShapeClass({
        ...options,
        fill: fillColor,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        ...(position && { left: position.left, top: position.top }),
      });
      addObject(object, !!position);
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
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length === 0) return;

        activeObjects.forEach((object) => canvas.remove(object));
        canvas.discardActiveObject();
        canvas.renderAll();
        save();
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
      initializeHistory: () => initializeHistory(),

      zoomIn: () => {
        zoomIn();
      },

      zoomOut: () => {
        zoomOut();
      },

      resetZoom: () => {
        resetZoom();
      },

      fitToScreen: () => {
        fitToScreen();
      },

      centerWorkspace: () => {
        centerWorkspace();
      },

      getCurrentZoom: () => getCurrentZoom(),

      isWorkspaceVisible: () => isWorkspaceVisible(),

      minZoom,
      maxZoom,

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
        canvas.freeDrawingBrush.color = strokeColor;
        canvas.freeDrawingBrush.width = strokeWidth;
      },

      setBrushType: (type: "pen" | "pencil" | "marker" | "highlighter") => {
        let brush: fabric.BaseBrush;
        // use current brush color from canvas to avoid stale closure
        const brushColor = canvas.freeDrawingBrush?.color || strokeColor;

        switch (type) {
          case "pencil":
            // pencil brush with noise/jitter texture
            brush = new fabric.PencilBrush(canvas);
            brush.width = strokeWidth || 2;
            brush.color = brushColor;
            // decimate adds jaggedness similar to pencil texture
            // @ts-ignore
            brush.decimate = 4;
            // @ts-ignore
            brush.strokeLineCap = "round";
            break;

          case "marker":
            // marker with thicker strokes and chisel-like cap
            brush = new fabric.PencilBrush(canvas);
            brush.width = Math.max(strokeWidth, 8);
            brush.color = brushColor;
            // @ts-ignore - square cap for chisel marker effect
            brush.strokeLineCap = "square";
            // @ts-ignore
            brush.strokeLineJoin = "bevel";
            // @ts-ignore - add slight transparency for layering effect
            const hexColor = brushColor.replace("#", "");
            const r = parseInt(hexColor.substring(0, 2), 16) || 0;
            const g = parseInt(hexColor.substring(2, 4), 16) || 0;
            const b = parseInt(hexColor.substring(4, 6), 16) || 0;
            brush.color = `rgba(${r}, ${g}, ${b}, 0.85)`;
            break;

          case "highlighter":
            // highlighter with semi-transparent color
            brush = new fabric.PencilBrush(canvas);
            brush.width = Math.max(strokeWidth, 16);
            // convert color to rgba with transparency
            const hlHex = brushColor.replace("#", "");
            const hr = parseInt(hlHex.substring(0, 2), 16) || 255;
            const hg = parseInt(hlHex.substring(2, 4), 16) || 255;
            const hb = parseInt(hlHex.substring(4, 6), 16) || 0;
            brush.color = `rgba(${hr}, ${hg}, ${hb}, 0.4)`;
            // @ts-ignore
            brush.strokeLineCap = "square";
            break;

          case "pen":
          default:
            // smooth pen brush
            brush = new fabric.PencilBrush(canvas);
            brush.width = strokeWidth || 2;
            brush.color = brushColor;
            // @ts-ignore
            brush.strokeLineCap = "round";
            // @ts-ignore
            brush.strokeLineJoin = "round";
            break;
        }

        canvas.freeDrawingBrush = brush;
        canvas.requestRenderAll();
      },

      disableDrawingMode: () => {
        canvas.isDrawingMode = false;
      },

      addCircle: (position?: { left: number; top: number }) =>
        createBasicShape(fabric.Circle, CIRCLE_OPTIONS, position),
      addRectangle: (position?: { left: number; top: number }) =>
        createBasicShape(fabric.Rect, RECTANGLE_OPTIONS, position),
      addSoftRectangle: (position?: { left: number; top: number }) =>
        createBasicShape(
          fabric.Rect,
          {
            ...RECTANGLE_OPTIONS,
            rx: 50,
            ry: 50,
          },
          position,
        ),
      addTriangle: (position?: { left: number; top: number }) =>
        createBasicShape(fabric.Triangle, TRIANGLE_OPTIONS, position),
      addDiamond: (position?: { left: number; top: number }) =>
        createBasicShape(
          fabric.Rect,
          {
            ...RECTANGLE_OPTIONS,
            width: 200,
            height: 200,
            angle: 45,
            rx: 30,
            ry: 30,
          },
          position,
        ),
      addInverseTriangle: (position?: { left: number; top: number }) => {
        const triangle = new fabric.Triangle({
          ...TRIANGLE_OPTIONS,
          angle: 180,
          width: 200,
          height: 200,
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          ...(position && { left: position.left, top: position.top }),
        });
        addObject(triangle, !!position);
      },

      // line
      addLine: (position?: { left: number; top: number }) => {
        const line = new fabric.Line([0, 0, 300, 0], {
          stroke: strokeColor,
          strokeWidth: strokeWidth || 4,
          left: position?.left ?? 100,
          top: position?.top ?? 100,
        });
        addObject(line, !!position);
      },

      // arrow shape
      addArrow: () => {
        const arrowPath = "M 0 50 L 200 50 L 200 25 L 250 50 L 200 75 L 200 50";
        const arrow = new fabric.Path(arrowPath, {
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          left: 100,
          top: 100,
          scaleX: 0.8,
          scaleY: 0.8,
        });
        addObject(arrow);
      },

      // double arrow
      addDoubleArrow: () => {
        const doubleArrowPath =
          "M 50 50 L 0 25 L 0 40 L 0 60 L 0 75 L 50 50 M 50 50 L 200 50 M 200 50 L 250 25 L 250 40 L 250 60 L 250 75 L 200 50";
        const arrow = new fabric.Path(
          "M 0 50 L 40 25 L 40 40 L 210 40 L 210 25 L 250 50 L 210 75 L 210 60 L 40 60 L 40 75 Z",
          {
            fill: fillColor,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            left: 100,
            top: 100,
            scaleX: 0.8,
            scaleY: 0.8,
          },
        );
        addObject(arrow);
      },

      // star shape
      addStar: () => {
        const points = [];
        const outerRadius = 100;
        const innerRadius = 50;
        const numPoints = 5;

        for (let i = 0; i < numPoints * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (Math.PI / numPoints) * i - Math.PI / 2;
          points.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
          });
        }

        const star = new fabric.Polygon(points, {
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          left: 100,
          top: 100,
        });
        addObject(star);
      },

      // hexagon shape
      addHexagon: () => {
        const points = [];
        const radius = 100;
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          points.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
          });
        }

        const hexagon = new fabric.Polygon(points, {
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          left: 100,
          top: 100,
        });
        addObject(hexagon);
      },

      // pentagon shape
      addPentagon: () => {
        const points = [];
        const radius = 100;
        for (let i = 0; i < 5; i++) {
          const angle = ((Math.PI * 2) / 5) * i - Math.PI / 2;
          points.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
          });
        }

        const pentagon = new fabric.Polygon(points, {
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          left: 100,
          top: 100,
        });
        addObject(pentagon);
      },

      // heart shape
      addHeart: () => {
        const heartPath =
          "M 140 20 C 73 20 20 74 20 140 C 20 275 156 310 290 478 C 424 310 560 275 560 140 C 560 74 507 20 440 20 C 399 20 362 41 340 74 C 340 74 340 74 340 74 C 318 41 281 20 240 20 C 207 20 176 20 140 20 Z";
        const heart = new fabric.Path(heartPath, {
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          left: 100,
          top: 100,
          scaleX: 0.4,
          scaleY: 0.4,
        });
        addObject(heart);
      },

      // octagon shape
      addOctagon: () => {
        const points = [];
        const radius = 100;
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI / 4) * i - Math.PI / 8;
          points.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
          });
        }

        const octagon = new fabric.Polygon(points, {
          fill: fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          left: 100,
          top: 100,
        });
        addObject(octagon);
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

      // image frame - creates a shape that can clip images
      addImageFrame: (
        shapeType:
          | "circle"
          | "rectangle"
          | "rounded"
          | "triangle"
          | "hexagon"
          | "star"
          | "heart",
        position?: { left: number; top: number },
      ) => {
        const frameSize = 200;
        const workspace = getWorkspace();
        const workspaceLeft = workspace?.left || 0;
        const workspaceTop = workspace?.top || 0;
        const workspaceWidth = workspace?.width || 500;
        const workspaceHeight = workspace?.height || 500;

        const centerX =
          position?.left ?? workspaceLeft + workspaceWidth / 2 - frameSize / 2;
        const centerY =
          position?.top ?? workspaceTop + workspaceHeight / 2 - frameSize / 2;

        let clipShape: fabric.Object;

        switch (shapeType) {
          case "circle":
            clipShape = new fabric.Circle({
              radius: frameSize / 2,
              fill: "#e5e7eb",
              stroke: "#9ca3af",
              strokeWidth: 2,
              strokeDashArray: [5, 5],
              left: centerX,
              top: centerY,
              originX: "left",
              originY: "top",
            });
            break;
          case "rounded":
            clipShape = new fabric.Rect({
              width: frameSize,
              height: frameSize,
              rx: 20,
              ry: 20,
              fill: "#e5e7eb",
              stroke: "#9ca3af",
              strokeWidth: 2,
              strokeDashArray: [5, 5],
              left: centerX,
              top: centerY,
            });
            break;
          case "triangle":
            clipShape = new fabric.Triangle({
              width: frameSize,
              height: frameSize,
              fill: "#e5e7eb",
              stroke: "#9ca3af",
              strokeWidth: 2,
              strokeDashArray: [5, 5],
              left: centerX,
              top: centerY,
            });
            break;
          case "hexagon": {
            const points = [];
            const radius = frameSize / 2;
            for (let i = 0; i < 6; i++) {
              const angle = (Math.PI / 3) * i;
              points.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
              });
            }
            clipShape = new fabric.Polygon(points, {
              fill: "#e5e7eb",
              stroke: "#9ca3af",
              strokeWidth: 2,
              strokeDashArray: [5, 5],
              left: centerX,
              top: centerY,
            });
            break;
          }
          case "star": {
            const points = [];
            const outerRadius = frameSize / 2;
            const innerRadius = frameSize / 4;
            for (let i = 0; i < 10; i++) {
              const radius = i % 2 === 0 ? outerRadius : innerRadius;
              const angle = (Math.PI / 5) * i - Math.PI / 2;
              points.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
              });
            }
            clipShape = new fabric.Polygon(points, {
              fill: "#e5e7eb",
              stroke: "#9ca3af",
              strokeWidth: 2,
              strokeDashArray: [5, 5],
              left: centerX,
              top: centerY,
            });
            break;
          }
          case "heart": {
            const heartPath =
              "M 140 20 C 73 20 20 74 20 140 C 20 275 156 310 290 478 C 424 310 560 275 560 140 C 560 74 507 20 440 20 C 399 20 362 41 340 74 C 340 74 340 74 340 74 C 318 41 281 20 240 20 C 207 20 176 20 140 20 Z";
            clipShape = new fabric.Path(heartPath, {
              fill: "#e5e7eb",
              stroke: "#9ca3af",
              strokeWidth: 2,
              strokeDashArray: [5, 5],
              left: centerX,
              top: centerY,
              scaleX: frameSize / 580,
              scaleY: frameSize / 500,
            });
            break;
          }
          default:
            clipShape = new fabric.Rect({
              width: frameSize,
              height: frameSize,
              fill: "#e5e7eb",
              stroke: "#9ca3af",
              strokeWidth: 2,
              strokeDashArray: [5, 5],
              left: centerX,
              top: centerY,
            });
        }

        // mark as image frame for special handling
        (clipShape as any).isImageFrame = true;
        (clipShape as any).frameType = shapeType;

        addObject(clipShape, !!position);
      },

      // clip image to a frame shape
      clipImageToFrame: (
        imageObject: fabric.Image,
        frameObject: fabric.Object,
      ) => {
        if (!(frameObject as any).isImageFrame) return;

        const frameBounds = frameObject.getBoundingRect();
        const imgWidth = imageObject.getScaledWidth();
        const imgHeight = imageObject.getScaledHeight();

        // scale image to cover the frame
        const scaleX = frameBounds.width / imgWidth;
        const scaleY = frameBounds.height / imgHeight;
        const coverScale = Math.max(scaleX, scaleY);

        imageObject.scale((imageObject.scaleX || 1) * coverScale);

        // center image on frame
        imageObject.set({
          left: frameBounds.left + frameBounds.width / 2,
          top: frameBounds.top + frameBounds.height / 2,
          originX: "center",
          originY: "center",
        });

        // create clipPath from frame shape
        frameObject.clone((clonedFrame: fabric.Object) => {
          clonedFrame.set({
            left: 0,
            top: 0,
            originX: "center",
            originY: "center",
            absolutePositioned: true,
          });

          // position clipPath at frame center
          const frameCenter = frameObject.getCenterPoint();
          clonedFrame.set({
            left: frameCenter.x,
            top: frameCenter.y,
          });

          imageObject.clipPath = clonedFrame;
          imageObject.setCoords();

          // remove the frame placeholder
          canvas.remove(frameObject);
          canvas.requestRenderAll();
          save();
        });
      },
      getActiveFillColor: () => {
        const activeObject = canvas.getActiveObject();
        return activeObject ? activeObject.get("fill") || fillColor : fillColor;
      },
      getActiveStrokeColor: () => {
        const activeObject = canvas.getActiveObject();
        if (!activeObject) return strokeColor;
        const color = isText(activeObject.type || "")
          ? activeObject.get("fill")
          : activeObject.get("stroke");
        return color || strokeColor;
      },
      getActiveOpacity: () => {
        const activeObject = canvas.getActiveObject();
        return activeObject ? (activeObject.get("opacity") ?? 1) : 1;
      },
      getActiveStrokeWidth: () => {
        const activeObject = canvas.getActiveObject();
        return activeObject
          ? (activeObject.get("strokeWidth") ?? strokeWidth)
          : strokeWidth;
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
          if (isText(object.type || "")) {
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
          if (isText(object.type || "")) {
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
          if (isText(object.type || "")) {
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
          if (isText(object.type || "")) {
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
          if (isText(object.type || "")) {
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
          if (isText(object.type || "")) {
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
          if (isText(object.type || "")) {
            // @ts-ignore
            object.set({ fontStyle: value });
          }
        });
        canvas.renderAll();
        save();
      },
      addImage: (value: string) => {
        console.log("Adding image with URL:", value);

        fabric.Image.fromURL(
          value,
          (image) => {
            console.log("Image loaded:", image);
            const workspace = getWorkspace();

            if (!image) {
              console.error("Failed to load image");
              return;
            }

            // Scale image to fit within workspace while maintaining aspect ratio
            const workspaceWidth = workspace?.width || 500;
            const workspaceHeight = workspace?.height || 500;

            const scale = Math.min(
              workspaceWidth / (image.width || 1),
              workspaceHeight / (image.height || 1),
            );

            image.scale(scale * 0.5); // Scale to 50% of workspace

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
          if (isText(object.type || "")) {
            // @ts-ignore
            object.set({ fontWeight: value });
          }
        });
        canvas.renderAll();
        save();
      },

      getWorkspace: () => getWorkspace(),
      autoZoom: () => autoZoom(),
      useAutoSave: () => {
        return {
          saveState: "Idle",
          setSaveState: (state: string) => {
            // Implement state management here
          },
        };
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
    copy,
    paste,
    save,
    canRedo,
    canUndo,
    undo,
    redo,
    autoZoom,
    getWorkspace,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    centerWorkspace,
    getCurrentZoom,
    isWorkspaceVisible,
    initializeHistory,
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
        selectable: true,
        evented: true,
        hasControls: true,
      });

      // allow controls to render outside canvas bounds
      initialCanvas.controlsAboveOverlay = true;
      initialCanvas.preserveObjectStacking = true;

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
      // Removed clipPath to allow elements to be visible outside canvas
      // initialCanvas.clipPath = initialWorkspace;

      setCanvas(initialCanvas);
      setContainer(initialContainer);

      initialCanvas.renderAll();

      // save initial state to history
      const initialState = JSON.stringify(initialCanvas.toJSON(JSON_KEYS));
      canvasHistory.current = [initialState];
      setHistoryIndex(0);
    },
    [canvasHistory, setHistoryIndex],
  );

  return {
    init,
    editor,
  };
};
