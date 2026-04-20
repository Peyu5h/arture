import { fabric } from "fabric";
fabric.Rect.fromObject({ type: "rect", name: "clip", width: 100 } as any, function(obj) {
  console.log(obj.name);
});
