import { fabric } from "fabric";
var json = '{"version":"5.5.2","objects":[{"type":"rect","width":100,"height":100,"fill":"#ff0000","name":"clip"}]}';
var canvas = new fabric.Canvas(null);
canvas.loadFromJSON(json, function() {
  console.log("Loaded names:", canvas.getObjects().map(o => (o as any).name));
});
