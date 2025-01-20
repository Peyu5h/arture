import { fabric } from "fabric";
import { useEvent } from "react-use";

interface useShortcutsProps {
  canvas: fabric.Canvas | null;
  undo: () => void;
  redo: () => void;
  save: (skip?: boolean) => void;
  copy: () => void;
  paste: () => void;
}

export const useShortcuts = ({
  canvas,
  undo,
  redo,
  save,
  copy,
  paste,
}: useShortcutsProps) => {
  useEvent("keydown", (event) => {
    const isCtrlKey = event.ctrlKey || event.metaKey;
    const isDelete = event.key === "Delete";
    const isInput = ["INPUT", "TEXTAREA"].includes(
      (event.target as HTMLElement).tagName,
    );

    if (isInput) return;

    if (isDelete) {
      canvas?.remove(...canvas.getActiveObjects());
      canvas?.discardActiveObject();
    }

    if (isCtrlKey && event.key === "z") {
      event.preventDefault();
      undo();
    }

    if (isCtrlKey && event.key === "y") {
      event.preventDefault();
      redo();
    }

    if (isCtrlKey && event.key === "c") {
      event.preventDefault();
      copy();
    }

    if (isCtrlKey && event.key === "v") {
      event.preventDefault();
      paste();
    }

    if (isCtrlKey && event.key === "s") {
      event.preventDefault();
      save(true);
    }

    if (isCtrlKey && event.key === "a") {
      event.preventDefault();
      canvas?.discardActiveObject();

      const allObjects = canvas
        ?.getObjects()
        .filter((object) => object.selectable);

      canvas?.setActiveObject(
        new fabric.ActiveSelection(allObjects, { canvas }),
      );
      canvas?.renderAll();
    }

    if (event.key === "[") {
      event.preventDefault();
      let zoomRatio = canvas?.getZoom() || 1;
      zoomRatio -= 0.05;
      const center = canvas?.getCenter();
      if (center) {
        canvas?.zoomToPoint(
          new fabric.Point(center.left, center.top),
          zoomRatio > 1 ? 1 : zoomRatio,
        );
      }
    }

    if (event.key === "]") {
      event.preventDefault();
      let zoomRatio = canvas?.getZoom() || 1;
      zoomRatio += 0.05;
      const center = canvas?.getCenter();
      if (center) {
        canvas?.zoomToPoint(
          new fabric.Point(center.left, center.top),
          zoomRatio > 1 ? 1 : zoomRatio,
        );
      }
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const activeObject = canvas?.getActiveObject();
      if (activeObject && activeObject.top) {
        activeObject.top -= 5;
        activeObject.setCoords();
        canvas?.renderAll();
      }
      save();
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const activeObject = canvas?.getActiveObject();
      if (activeObject && activeObject.top) {
        activeObject.top += 5;
        activeObject.setCoords();
        canvas?.renderAll();
      }
      save();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      const activeObject = canvas?.getActiveObject();
      if (activeObject && activeObject.left) {
        activeObject.left -= 5;
        activeObject.setCoords();
        canvas?.renderAll();
      }
      save();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      const activeObject = canvas?.getActiveObject();
      if (activeObject && activeObject.left) {
        activeObject.left += 5;
        activeObject.setCoords();
        canvas?.renderAll();
      }
      save();
    }
  });
};
