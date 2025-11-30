"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useDragContext } from "~/contexts/drag-context";

export const CanvasDropZone = () => {
  const { dragState } = useDragContext();
  const { isDragging, isOverWorkspace, workspaceBounds } = dragState;

  // only show border when dragging and workspace bounds are available
  const showBorder = isDragging && isOverWorkspace && workspaceBounds;

  return (
    <AnimatePresence>
      {showBorder && workspaceBounds && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="pointer-events-none fixed z-[100]"
          style={{
            left: workspaceBounds.left - 2,
            top: workspaceBounds.top - 2,
            width: workspaceBounds.width + 4,
            height: workspaceBounds.height + 4,
            border: "2px solid #3b82f6",
            borderRadius: "4px",
            boxShadow: "0 0 0 1px rgba(59, 130, 246, 0.3)",
          }}
        />
      )}
    </AnimatePresence>
  );
};
