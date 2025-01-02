import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { ny } from "~/lib/utils";

interface SidebarBaseProps {
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
}: SidebarBaseProps) => {
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        isVisible
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.aside
          ref={sidebarRef}
          initial={{ x: -360, opacity: 1 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -360, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={ny(
            "absolute z-[40] flex h-full w-[360px] flex-col border-r bg-white shadow-lg",
            className,
          )}
        >
          {children}
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
