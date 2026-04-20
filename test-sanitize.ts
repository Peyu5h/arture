import { sanitizeCanvasJson } from "./src/lib/canvas-json";
const mockPattern = {
  type: "pattern",
  repeat: "no-repeat",
  source: { src: "http://example.com/image.jpg" }
};
const result = sanitizeCanvasJson(mockPattern);
console.log(JSON.stringify(result, null, 2));
