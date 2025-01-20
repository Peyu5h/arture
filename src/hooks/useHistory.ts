"use client";

import { fabric } from "fabric";
import { useCallback, useEffect, useRef, useState } from "react";
import { JSON_KEYS } from "~/components/editor/types";

interface HistoryProps {
  canvas: fabric.Canvas | null;
}

export const useHistory = ({ canvas }: HistoryProps) => {
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const canvasHistory = useRef<string[]>([]);
  const skipSaving = useRef<boolean>(false);

  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  const isScaling = useRef<boolean>(false);
  const isMoving = useRef<boolean>(false);
  const isModifying = useRef<boolean>(false);

  const canUndo = useCallback(() => {
    return historyIndex > 0;
  }, [historyIndex]);

  const canRedo = useCallback(() => {
    return historyIndex < canvasHistory.current.length - 1;
  }, [historyIndex]);

  const clearPendingSave = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
  }, []);

  const debouncedSave = useCallback(
    (force: boolean = false) => {
      if (!canvas || skipSaving.current) return;

      clearPendingSave();

      if (
        !force &&
        (isScaling.current || isMoving.current || isModifying.current)
      ) {
        return;
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
      }, 250);
    },
    [canvas, historyIndex, clearPendingSave],
  );

  const save = useCallback(
    (skip: boolean = false) => {
      if (!canvas || skip || skipSaving.current) return;

      clearPendingSave();
      const currState = JSON.stringify(canvas.toJSON(JSON_KEYS));
      const prevState = canvasHistory.current[canvasHistory.current.length - 1];

      if (currState !== prevState) {
        canvasHistory.current = canvasHistory.current.slice(
          0,
          historyIndex + 1,
        );
        canvasHistory.current.push(currState);
        setHistoryIndex(canvasHistory.current.length - 1);
      }
    },
    [canvas, historyIndex, clearPendingSave],
  );

  const setupCanvasEvents = useCallback(() => {
    if (!canvas) return;

    canvas.on("object:scaling:started", () => {
      isScaling.current = true;
    });

    canvas.on("object:scaling:ended", () => {
      isScaling.current = false;
      debouncedSave(true);
    });

    canvas.on("object:moving:started", () => {
      isMoving.current = true;
    });

    canvas.on("object:moving:ended", () => {
      isMoving.current = false;
      debouncedSave(true);
    });

    canvas.on("object:modified", () => {
      if (!isScaling.current && !isMoving.current) {
        debouncedSave(true);
      }
    });

    canvas.on("selection:created", () => save());
    canvas.on("selection:updated", () => save());
    canvas.on("selection:cleared", () => save());

    canvas.on("object:added", () => save());
    canvas.on("object:removed", () => save());

    canvas.on("path:created", () => save());
  }, [canvas, save, debouncedSave]);

  const undo = useCallback(() => {
    if (!canUndo() || !canvas) return;

    skipSaving.current = true;
    const prevIndex = historyIndex - 1;
    const prevState = JSON.parse(canvasHistory.current[prevIndex]);

    canvas.clear().renderAll();
    canvas.loadFromJSON(prevState, () => {
      canvas.renderAll();
      setHistoryIndex(prevIndex);
      skipSaving.current = false;
    });
  }, [canvas, historyIndex, canUndo]);

  const redo = useCallback(() => {
    if (!canRedo() || !canvas) return;

    skipSaving.current = true;
    const nextIndex = historyIndex + 1;
    const nextState = JSON.parse(canvasHistory.current[nextIndex]);

    canvas.clear().renderAll();
    canvas.loadFromJSON(nextState, () => {
      canvas.renderAll();
      setHistoryIndex(nextIndex);
      skipSaving.current = false;
    });
  }, [canvas, historyIndex, canRedo]);

  useEffect(() => {
    setupCanvasEvents();
    return () => {
      if (canvas) {
        canvas.off();
      }
      clearPendingSave();
    };
  }, [canvas, setupCanvasEvents, clearPendingSave]);

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
