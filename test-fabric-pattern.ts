import { fabric } from "fabric";
var img = new fabric.Image().getElement();
img.src = "http://example.com/image.jpg";
var options = { source: img, repeat: "no-repeat", crossOrigin: "anonymous" };
var p = new fabric.Pattern(options);
var obj = p.toObject();
obj.source = obj.source ? obj.source.src : null; // just for logging
console.log(obj);
