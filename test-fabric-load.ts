import { fabric } from "fabric";
var canvas = new fabric.Canvas(null);
var rect = new fabric.Rect({ width: 100, height: 100, name: "clip", fill: "#ff0000" } as any);
canvas.add(rect);
var json = JSON.stringify(canvas.toJSON(["name"]));
console.log("JSON:", json);
var canvas2 = new fabric.Canvas(null);
canvas2.loadFromJSON(json, function() {
  console.log("Loaded:", canvas2.getObjects().map(o => ({ name: (o as any).name, fill: o.fill })));
});
