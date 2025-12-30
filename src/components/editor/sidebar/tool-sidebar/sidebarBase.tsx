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
    <div className="absolute left-20 h-full">
      <AnimatePresence>
        {isVisible && (
          <motion.aside
            ref={sidebarRef}
            data-sidebar="tool"
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className={ny(
              "bg-card absolute z-[40] flex h-full w-[360px] flex-col border-r shadow-xl select-none",
              className,
            )}
          >
            {children}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};
