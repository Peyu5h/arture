import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { ny } from "~/lib/utils";

interface MainSidebarBaseProps {
  children: React.ReactNode;
  isVisible: boolean;
  onClose: () => void;
  className?: string;
}

export const SidebarBase = ({
  children,
  isVisible,
  onClose,
  className,
}: MainSidebarBaseProps) => {
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (sidebarRef.current?.contains(target)) {
        return;
      }

      if (target.closest(".canvas-container")) {
        return;
      }

      if (target.closest("[data-sidebar]")) {
        return;
      }

      if (isVisible) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isVisible, onClose]);

  return (
    <div className="absolute left-24 h-full ">
      <AnimatePresence>
        {isVisible && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none fixed inset-0 z-30"
            />
            <motion.aside
              ref={sidebarRef}
              data-sidebar="tool"
              initial={{ x: -400, opacity: 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
              className={ny(
                "absolute z-[40] flex h-full w-[360px] flex-col border-r bg-white shadow-lg",
                className,
              )}
            >
              {children}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
