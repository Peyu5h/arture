import { fabric } from "fabric";
import { useEvent } from "react-use";

interface useShortcutsProps {
  canvas: fabric.Canvas | null;
  undo: () => void;
  redo: () => void;
  save: (skip?: boolean) => void;
  copy: () => void;
  paste: () => void;
  zoomIn?: () => void;
  zoomOut?: () => void;
  resetZoom?: () => void;
}

export const useShortcuts = ({
  canvas,
  undo,
  redo,
  save,
  copy,
  paste,
  zoomIn,
  zoomOut,
  resetZoom,
}: useShortcutsProps) => {
  useEvent("keydown", (event) => {
    const isCtrlKey = event.ctrlKey || event.metaKey;
    const isDelete = event.key === "Delete";
    const target = event.target as HTMLElement;
    const isInput = ["INPUT", "TEXTAREA"].includes(target.tagName);
    const isEditable = target.isContentEditable;
    const hasSelection = window.getSelection()?.toString();

    // allow system copy/paste when in input, editable, or text is selected
    if (isInput || isEditable) return;

    // check if canvas has active selection
    const hasCanvasSelection =
      canvas?.getActiveObject() ||
      (canvas?.getActiveObjects()?.length ?? 0) > 0;

    if (isDelete && hasCanvasSelection) {
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

    // only intercept copy if canvas has selection and no text is selected
    if (isCtrlKey && event.key === "c" && hasCanvasSelection && !hasSelection) {
      event.preventDefault();
      copy();
    }

    // only intercept paste if canvas has focus (no text selection)
    if (isCtrlKey && event.key === "v" && !hasSelection) {
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
      canvas?.requestRenderAll(); // instant visual feedback
    }

    if (event.key === "[") {
      event.preventDefault();
      zoomOut?.();
    }

    if (event.key === "]") {
      event.preventDefault();
      zoomIn?.();
    }

    if (event.key === "0") {
      event.preventDefault();
      resetZoom?.();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const activeObject = canvas?.getActiveObject();
      if (activeObject && activeObject.top) {
        activeObject.top -= 5;
        activeObject.setCoords();
        canvas?.requestRenderAll();
      }
      save();
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const activeObject = canvas?.getActiveObject();
      if (activeObject && activeObject.top) {
        activeObject.top += 5;
        activeObject.setCoords();
        canvas?.requestRenderAll();
      }
      save();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      const activeObject = canvas?.getActiveObject();
      if (activeObject && activeObject.left) {
        activeObject.left -= 5;
        activeObject.setCoords();
        canvas?.requestRenderAll();
      }
      save();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      const activeObject = canvas?.getActiveObject();
      if (activeObject && activeObject.left) {
        activeObject.left += 5;
        activeObject.setCoords();
        canvas?.requestRenderAll();
      }
      save();
    }
  });
};
