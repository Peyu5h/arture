"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";

export type DragItemType = "shape" | "text" | "image" | "template";

export interface DragItem {
  type: DragItemType;
  data: Record<string, any>;
}

interface DragState {
  isDragging: boolean;
  item: DragItem | null;
  position: { x: number; y: number };
  isOverCanvas: boolean;
}

interface DragContextValue {
  dragState: DragState;
  startDrag: (e: React.MouseEvent | React.TouchEvent, item: DragItem) => void;
  setOnDrop: (
    callback:
      | ((item: DragItem, position: { x: number; y: number }) => void)
      | null,
  ) => void;
}

const defaultDragState: DragState = {
  isDragging: false,
  item: null,
  position: { x: 0, y: 0 },
  isOverCanvas: false,
};

const defaultContextValue: DragContextValue = {
  dragState: defaultDragState,
  startDrag: () => {},
  setOnDrop: () => {},
};

const DragContext = createContext<DragContextValue>(defaultContextValue);

export const useDragContext = () => {
  return useContext(DragContext);
};

interface DragProviderProps {
  children: ReactNode;
  canvasSelector?: string;
}

export const DragProvider = ({
  children,
  canvasSelector = ".canvas-container",
}: DragProviderProps) => {
  const [dragState, setDragState] = useState<DragState>(defaultDragState);
  const onDropCallbackRef = useRef<
    ((item: DragItem, position: { x: number; y: number }) => void) | null
  >(null);
  const isDraggingRef = useRef(false);
  const dragItemRef = useRef<DragItem | null>(null);

  const isPointOverCanvas = useCallback(
    (x: number, y: number): boolean => {
      const canvas = document.querySelector(canvasSelector);
      if (!canvas) return false;

      const rect = canvas.getBoundingClientRect();
      return (
        x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
      );
    },
    [canvasSelector],
  );

  const getCanvasRelativePosition = useCallback(
    (x: number, y: number): { x: number; y: number } => {
      const canvas = document.querySelector(canvasSelector);
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      return {
        x: x - rect.left,
        y: y - rect.top,
      };
    },
    [canvasSelector],
  );

  const startDrag = useCallback(
    (e: React.MouseEvent | React.TouchEvent, item: DragItem) => {
      e.preventDefault();
      e.stopPropagation();

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      isDraggingRef.current = true;
      dragItemRef.current = item;

      setDragState({
        isDragging: true,
        item,
        position: { x: clientX, y: clientY },
        isOverCanvas: isPointOverCanvas(clientX, clientY),
      });
    },
    [isPointOverCanvas],
  );

  const setOnDrop = useCallback(
    (
      callback:
        | ((item: DragItem, position: { x: number; y: number }) => void)
        | null,
    ) => {
      onDropCallbackRef.current = callback;
    },
    [],
  );

  useEffect(() => {
    const updateDrag = (clientX: number, clientY: number) => {
      if (!isDraggingRef.current) return;

      setDragState((prev) => ({
        ...prev,
        position: { x: clientX, y: clientY },
        isOverCanvas: isPointOverCanvas(clientX, clientY),
      }));
    };

    const endDrag = (clientX: number, clientY: number) => {
      if (!isDraggingRef.current) return;

      const item = dragItemRef.current;
      if (item && isPointOverCanvas(clientX, clientY)) {
        const canvasPosition = getCanvasRelativePosition(clientX, clientY);
        onDropCallbackRef.current?.(item, canvasPosition);
      }

      isDraggingRef.current = false;
      dragItemRef.current = null;

      setDragState(defaultDragState);

      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      updateDrag(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      if (e.touches.length > 0) {
        e.preventDefault();
        updateDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      endDrag(e.clientX, e.clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      if (e.changedTouches.length > 0) {
        endDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDraggingRef.current) {
        isDraggingRef.current = false;
        dragItemRef.current = null;
        setDragState(defaultDragState);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPointOverCanvas, getCanvasRelativePosition]);

  useEffect(() => {
    if (dragState.isDragging) {
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    }
  }, [dragState.isDragging]);

  return (
    <DragContext.Provider value={{ dragState, startDrag, setOnDrop }}>
      {children}
    </DragContext.Provider>
  );
};
