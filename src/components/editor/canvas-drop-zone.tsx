"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useDragContext } from "~/contexts/drag-context";

export const CanvasDropZone = () => {
  const { dragState } = useDragContext();

  return (
    <AnimatePresence>
      {dragState.isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-none absolute inset-0 z-50"
          style={{
            border: dragState.isOverCanvas
              ? "3px solid #3b82f6"
              : "3px solid transparent",
            borderRadius: "8px",
            backgroundColor: dragState.isOverCanvas
              ? "rgba(59, 130, 246, 0.08)"
              : "transparent",
            boxShadow: dragState.isOverCanvas
              ? "inset 0 0 20px rgba(59, 130, 246, 0.15)"
              : "none",
            transition:
              "border-color 0.15s, background-color 0.15s, box-shadow 0.15s",
          }}
        />
      )}
    </AnimatePresence>
  );
};
