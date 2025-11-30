import { ChevronsLeft } from "lucide-react";
import { motion } from "framer-motion";

interface ToolSidebarCloseProps {
  onClick: () => void;
}

export const ToolSidebarClose = ({ onClick }: ToolSidebarCloseProps) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group bg-card hover:bg-muted/80 absolute top-1/2 -right-5 flex h-16 -translate-y-1/2 transform items-center justify-center rounded-r-xl border-y border-r shadow-sm transition-colors"
    >
      <div className="flex items-center px-1.5">
        <ChevronsLeft className="text-muted-foreground group-hover:text-foreground size-4 transition-colors" />
      </div>
    </motion.button>
  );
};
