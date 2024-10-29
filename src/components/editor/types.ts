export type ActiveTool =
  | "select"
  | "shapes"
  | "text"
  | "images"
  | "draw"
  | "settings"
  | "ai"
  | "templates";

export const FILL_COLOR = "rgba(0,0,0,1)";
export const STROKE_COLOR = "rgba(0,0,0,1)";
export const STROKE_WIDTH = 2;
export const STROKE_DASH_ARRAY = [];
export const FONT_FAMILY = "Arial";
export const FONT_SIZE = 32;
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

export type BuildEditorProps = {
  canvas: fabric.Canvas;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  selectedObjects: fabric.Object[];
};

export interface Editor {
  changeFillColor: (value: string) => void;
  changeStrokeColor: (value: string) => void;
  changeStrokeWidth: (value: number) => void;
  addCircle: () => void;
  addSoftRectangle: () => void;
  addRectangle: () => void;
  addTriangle: () => void;
  addInverseTriangle: () => void;
  addDiamond: () => void;
  canvas: fabric.Canvas;
}

export interface EditorProps {
  canvas: fabric.Canvas;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  setFillColor: (value: string) => void;
  setStrokeColor: (value: string) => void;
  setStrokeWidth: (value: number) => void;
}
