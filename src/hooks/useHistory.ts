import { fabric } from "fabric";
import { useCallback, useRef, useState, useEffect } from "react";
import { JSON_KEYS } from "~/components/editor/types";

interface HistoryProps {
  canvas: fabric.Canvas | null;
}

export const useHistory = ({ canvas }: HistoryProps) => {
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const canvasHistory = useRef<string[]>([]);
  const skipSaving = useRef<boolean>(false);
  const isTransitioning = useRef<boolean>(false);

  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  const canUndo = useCallback(() => {
    return historyIndex > 0;
  }, [historyIndex]);

  const canRedo = useCallback(() => {
    return historyIndex < canvasHistory.current.length - 1;
  }, [historyIndex]);

  const save = useCallback(
    (skip: boolean = false) => {
      if (!canvas || skip || skipSaving.current || isTransitioning.current)
        return;

      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }

      saveTimer.current = setTimeout(() => {
        const currState = JSON.stringify(canvas.toJSON(JSON_KEYS));
        const prevState =
          canvasHistory.current[canvasHistory.current.length - 1];

        if (currState !== prevState) {
          canvasHistory.current = canvasHistory.current.slice(
            0,
            historyIndex + 1,
          );
          canvasHistory.current.push(currState);
          setHistoryIndex(canvasHistory.current.length - 1);
        }
      }, 100);
    },
    [canvas, historyIndex],
  );

  const loadState = useCallback(
    (state: any) => {
      if (!canvas) return;

      const zoom = canvas.getZoom();
      const viewportTransform = canvas.viewportTransform
        ? [...canvas.viewportTransform]
        : null;

      canvas.renderOnAddRemove = false;

      canvas.loadFromJSON(state, () => {
        if (viewportTransform) {
          canvas.viewportTransform = viewportTransform;
        }
        canvas.setZoom(zoom);

        canvas.renderOnAddRemove = true;
        canvas.requestRenderAll();

        isTransitioning.current = false;
      });
    },
    [canvas],
  );

  const undo = useCallback(() => {
    if (!canUndo() || !canvas || isTransitioning.current) return;

    isTransitioning.current = true;
    skipSaving.current = true;

    const prevIndex = historyIndex - 1;
    const prevState = JSON.parse(canvasHistory.current[prevIndex]);

    loadState(prevState);
    setHistoryIndex(prevIndex);

    setTimeout(() => {
      skipSaving.current = false;
    }, 100);
  }, [canvas, historyIndex, canUndo, loadState]);

  const redo = useCallback(() => {
    if (!canRedo() || !canvas || isTransitioning.current) return;

    isTransitioning.current = true;
    skipSaving.current = true;

    const nextIndex = historyIndex + 1;
    const nextState = JSON.parse(canvasHistory.current[nextIndex]);

    loadState(nextState);
    setHistoryIndex(nextIndex);

    setTimeout(() => {
      skipSaving.current = false;
    }, 100);
  }, [canvas, historyIndex, canRedo, loadState]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, []);

  return {
    save,
    canUndo,
    canRedo,
    undo,
    redo,
    setHistoryIndex,
    canvasHistory,
  };
};
