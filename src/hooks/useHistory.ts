import { fabric } from "fabric";
import { useCallback, useRef, useState, useEffect } from "react";
import { JSON_KEYS } from "~/lib/types";

interface HistoryProps {
  canvas: fabric.Canvas | null;
}

export const useHistory = ({ canvas }: HistoryProps) => {
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const canvasHistory = useRef<string[]>([]);
  const isRestoring = useRef<boolean>(false);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSavedState = useRef<string>("");

  const canUndo = useCallback(() => {
    return historyIndex > 0;
  }, [historyIndex]);

  const canRedo = useCallback(() => {
    return historyIndex >= 0 && historyIndex < canvasHistory.current.length - 1;
  }, [historyIndex]);

  // get serializable state excluding workspace
  const getSerializableState = useCallback(() => {
    if (!canvas) return "";
    const json = canvas.toJSON(JSON_KEYS);
    // filter out workspace for comparison but keep full state
    return JSON.stringify(json);
  }, [canvas]);

  // compare states (excluding workspace object for comparison)
  const statesAreEqual = useCallback((state1: string, state2: string) => {
    if (!state1 || !state2) return false;
    try {
      const obj1 = JSON.parse(state1);
      const obj2 = JSON.parse(state2);
      // filter out workspace for comparison
      const filter1 = obj1.objects?.filter((o: any) => o.name !== "clip") || [];
      const filter2 = obj2.objects?.filter((o: any) => o.name !== "clip") || [];
      return JSON.stringify(filter1) === JSON.stringify(filter2);
    } catch {
      return state1 === state2;
    }
  }, []);

  const save = useCallback(
    (skip: boolean = false) => {
      if (!canvas || skip || isRestoring.current) {
        return;
      }

      // clear any pending save
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }

      saveTimer.current = setTimeout(() => {
        if (!canvas || isRestoring.current) return;

        const currentState = getSerializableState();
        
        // skip if no actual change
        if (statesAreEqual(currentState, lastSavedState.current)) {
          return;
        }

        // truncate future history if we've undone
        if (historyIndex < canvasHistory.current.length - 1) {
          canvasHistory.current = canvasHistory.current.slice(0, historyIndex + 1);
        }

        canvasHistory.current.push(currentState);
        const newIndex = canvasHistory.current.length - 1;
        setHistoryIndex(newIndex);
        lastSavedState.current = currentState;
      }, 250);
    },
    [canvas, historyIndex, getSerializableState, statesAreEqual],
  );

  const restoreState = useCallback(
    (stateJson: string) => {
      if (!canvas) return;

      isRestoring.current = true;

      // preserve view
      const zoom = canvas.getZoom();
      const vpt = canvas.viewportTransform ? [...canvas.viewportTransform] : null;

      // find workspace
      const workspace = canvas.getObjects().find((obj) => obj.name === "clip");
      const workspaceData = workspace
        ? {
            width: workspace.width,
            height: workspace.height,
            left: workspace.left,
            top: workspace.top,
            fill: (workspace as fabric.Rect).fill,
          }
        : null;

      canvas.renderOnAddRemove = false;

      try {
        const parsed = JSON.parse(stateJson);
        canvas.loadFromJSON(parsed, () => {
          // restore workspace if needed
          if (workspaceData) {
            const ws = canvas.getObjects().find((obj) => obj.name === "clip");
            if (ws) {
              ws.set(workspaceData);
              ws.setCoords();
            }
          }

          // update coords for all objects
          canvas.getObjects().forEach((obj) => obj.setCoords());

          // restore view
          if (vpt) canvas.viewportTransform = vpt as any;
          canvas.setZoom(zoom);

          canvas.renderOnAddRemove = true;
          canvas.discardActiveObject();
          canvas.renderAll();

          lastSavedState.current = stateJson;

          setTimeout(() => {
            isRestoring.current = false;
          }, 50);
        });
      } catch (e) {
        console.error("Failed to restore state:", e);
        isRestoring.current = false;
      }
    },
    [canvas],
  );

  const undo = useCallback(() => {
    if (!canUndo() || !canvas || isRestoring.current) return;

    const prevIndex = historyIndex - 1;
    const prevState = canvasHistory.current[prevIndex];
    
    if (prevState) {
      setHistoryIndex(prevIndex);
      restoreState(prevState);
    }
  }, [canvas, historyIndex, canUndo, restoreState]);

  const redo = useCallback(() => {
    if (!canRedo() || !canvas || isRestoring.current) return;

    const nextIndex = historyIndex + 1;
    const nextState = canvasHistory.current[nextIndex];
    
    if (nextState) {
      setHistoryIndex(nextIndex);
      restoreState(nextState);
    }
  }, [canvas, historyIndex, canRedo, restoreState]);

  // cleanup
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
