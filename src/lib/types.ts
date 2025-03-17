import { ITextboxOptions } from "fabric/fabric-impl";
import * as material from "material-colors";

export const selectionDependentTool = [
  "fill",
  "font",
  "filter",
  "opacity",
  "remove-bg",
  "strokeColor",
];

export type UseEditorProps = {
  clearSelection: () => void;
  onModified?: () => void;
};

export type ActiveTool =
  | "select"
  | "shapes"
  | "text"
  | "images"
  | "draw"
  | "settings"
  | "ai"
  | "templates"
  | "fill"
  | "strokeWidth"
  | "strokeColor"
  | "opacity"
  | "font";

export const FILL_COLOR = "rgba(0,0,0,1)";
export const STROKE_COLOR = "rgba(0,0,0,1)";
export const STROKE_WIDTH = 2;
export const STROKE_DASH_ARRAY = [];
export const FONT_FAMILY = "Arial";
export const FONT_SIZE = 100;
export const FONT_WEIGHT = 400;

export const CIRCLE_OPTIONS = {
  radius: 225,
  left: 100,
  top: 100,
  fill: FILL_COLOR,
  stroke: STROKE_COLOR,
  strokeWidth: STROKE_WIDTH,
};

export const RECTANGLE_OPTIONS = {
  left: 100,
  top: 100,
  fill: FILL_COLOR,
  stroke: STROKE_COLOR,
  strokeWidth: STROKE_WIDTH,
  width: 400,
  height: 400,
  angle: 0,
};

export const DIAMOND_OPTIONS = {
  left: 100,
  top: 100,
  fill: FILL_COLOR,
  stroke: STROKE_COLOR,
  strokeWidth: STROKE_WIDTH,
  width: 600,
  height: 600,
  angle: 0,
};

export const TRIANGLE_OPTIONS = {
  left: 100,
  top: 100,
  fill: FILL_COLOR,
  stroke: STROKE_COLOR,
  strokeWidth: STROKE_WIDTH,
  width: 400,
  height: 400,
  angle: 0,
};

export const TEXT_OPTIONS = {
  left: 100,
  top: 100,
  fill: FILL_COLOR,
  fontSize: FONT_SIZE,
  fontFamily: FONT_FAMILY,
  fontWeight: FONT_WEIGHT,
  text: "Hello",
};

export type Editor = {
  canvas: fabric.Canvas;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  changeFillColor: (value: string) => void;
  changeStrokeColor: (value: string) => void;
  changeStrokeWidth: (value: number) => void;
  addCircle: () => void;
  addSoftRectangle: () => void;
  addRectangle: () => void;
  addTriangle: () => void;
  addInverseTriangle: () => void;
  addDiamond: () => void;
  getActiveFillColor: () => string | fabric.Pattern | fabric.Gradient;
  getActiveStrokeColor: () => string | fabric.Pattern | fabric.Gradient;
  bringForward: () => void;
  sendBackward: () => void;
  delete: () => void;
  onCopy: () => void;
  onPaste: () => void;
  undo: () => void;
  redo: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  save: (skip?: boolean) => void;
  changeSize: (value: { width: number; height: number }) => void;
  changeBackground: (value: string) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  enableDrawingMode: () => void;
  disableDrawingMode: () => void;
  addImage: (value: string) => void;
  strokeType: "solid" | "dashed";
  changeStrokeType: (type: "solid" | "dashed") => void;
  getActiveOpacity: () => number;
  changeOpacity: (value: number) => void;
  addText: (value: string, options?: ITextboxOptions) => void;
  getActiveStrokeWidth: () => number;
  getWorkspace: () => fabric.Rect | null;
  autoZoom: () => void;
  savePng: () => void;
  savePdf: () => void;
  saveSvg: () => void;
  saveJpg: () => void;
  saveJson: () => void;
  loadJson: (value: string) => void;

  // text tools
  changeFontSize: (value: number) => void;
  getActiveFontSize: () => number;
  changeTextAlign: (value: string) => void;
  getActiveTextAlign: () => string;
  changeFontUnderline: (value: boolean) => void;
  getActiveFontUnderline: () => boolean;
  changeFontLinethrough: (value: boolean) => void;
  getActiveFontLinethrough: () => boolean;
  changeFontStyle: (value: string) => void;
  getActiveFontStyle: () => string;
  changeFontWeight: (value: number) => void;
  getActiveFontWeight: () => number;
  changeFontFamily: (value: string) => void;
  getActiveFontFamily: () => string;
  onModified?: () => void;
};

export interface EditorProps {
  canvas: fabric.Canvas;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  fontFamily: string;
  setFontFamily: (value: string) => void;
  setFillColor: (value: string) => void;
  setStrokeColor: (value: string) => void;
  setStrokeWidth: (value: number) => void;
  getActiveFillColor: () => string | fabric.Pattern | fabric.Gradient;
  getActiveStrokeColor: () => string | fabric.Pattern | fabric.Gradient;
  changeFillColor: (value: string) => void;
  bringForward: () => void;
  sendBackward: () => void;
  getActiveOpacity: () => number;
  changeOpacity: (value: number) => void;
  selectedObjects: fabric.Object[] | null;
  strokeType: "solid" | "dashed";
  changeStrokeType: (type: "solid" | "dashed") => void;
}

export const colors = [
  material.red["500"],
  material.pink["500"],
  material.purple["500"],
  material.deepPurple["500"],
  material.indigo["500"],
  material.blue["500"],
  material.lightBlue["500"],
  material.cyan["500"],
  material.teal["500"],
  material.green["500"],
  material.lightGreen["500"],
  material.lime["500"],
  material.yellow["500"],
  material.amber["500"],
  material.orange["500"],
  material.deepOrange["500"],
  material.brown["500"],
  material.blueGrey["500"],
  material.grey["500"],
  "transparent",
];

export const fonts = [
  "Arial",
  "Arial Black",
  "Verdana",
  "Helvetica",
  "Tahoma",
  "Trebuchet MS",
  "Times New Roman",
  "Georgia",
  "Garamond",
  "Courier New",
  "Brush Script MT",
  "Palatino",
  "Bookman",
  "Comic Sans MS",
  "Impact",
  "Lucida Sans Unicode",
  "Geneva",
  "Lucida Console",
];

export const JSON_KEYS = [
  "name",
  "gradientAngle",
  "selectable",
  "hasControls",
  "linkData",
  "editable",
  "extensionType",
  "extension",
];

export interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  user: {
    name: string;
    username: string;
  };
}

export interface SearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashImage[];
}

export interface CanvasEvents {
  canvas: fabric.Canvas | null;
  save: () => void;
  setSelectedObjects: React.Dispatch<
    React.SetStateAction<fabric.Object[] | null>
  >;
  clearSelection?: () => void;
  onModified?: () => void;
}

export type CanvasStateValue = [
  "name",
  "selectable",
  "hasControls",
  "width",
  "height",
  "fill",
  "stroke",
  "strokeWidth",
  "strokeDashArray",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "textAlign",
  "underline",
  "linethrough",
  "opacity",
  "shadow",
  "clipPath",
  "visible",
  "backgroundColor",
  "radius",
  "startAngle",
  "endAngle",
  "type",
  "originX",
  "originY",
  "left",
  "top",
  "scaleX",
  "scaleY",
  "flipX",
  "flipY",
  "skewX",
  "skewY",
  "angle",
  "src",
  "crossOrigin",
];
