import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Unlock, Trash2, GripVertical } from "lucide-react";
import { ny } from "~/lib/utils";

export interface LayerData {
  id: string;
  name: string;
  type: "text" | "image" | "shape" | "path" | "group" | "svg";
  locked: boolean;
  visible: boolean;
  thumbnail: string | null;
  fabricObject: fabric.Object;
}

interface LayerItemProps {
  layer: LayerData;
  isSelected: boolean;
  onSelect: () => void;
  onToggleLock: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}

export const LayerItem = ({
  layer,
  isSelected,
  onSelect,
  onToggleLock,
  onToggleVisibility,
  onDelete,
}: LayerItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getTypeIcon = () => {
    switch (layer.type) {
      case "text":
        return "T";
      case "image":
        return "I";
      case "shape":
        return "S";
      case "path":
        return "P";
      case "svg":
        return "V";
      case "group":
        return "G";
      default:
        return "L";
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={ny(
        "group flex items-center gap-2 rounded-lg border p-2 transition-all",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:border-primary/30",
        layer.locked && "opacity-60",
        !layer.visible && "opacity-40",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none active:cursor-grabbing"
      >
        <GripVertical className="text-muted-foreground size-4" />
      </button>

      <button
        onClick={onSelect}
        disabled={layer.locked}
        className="flex flex-1 items-center gap-2 overflow-hidden"
      >
        <div className="bg-muted flex size-8 shrink-0 items-center justify-center overflow-hidden rounded">
          {layer.thumbnail ? (
            <img
              src={layer.thumbnail}
              alt={layer.name}
              className="size-full object-contain"
            />
          ) : (
            <span className="text-muted-foreground text-xs font-medium">
              {getTypeIcon()}
            </span>
          )}
        </div>

        <span className="truncate text-xs font-medium">{layer.name}</span>
      </button>

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
          title={layer.visible ? "Hide" : "Show"}
        >
          {layer.visible ? (
            <Eye className="size-3.5" />
          ) : (
            <EyeOff className="size-3.5" />
          )}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
          title={layer.locked ? "Unlock" : "Lock"}
        >
          {layer.locked ? (
            <Lock className="size-3.5" />
          ) : (
            <Unlock className="size-3.5" />
          )}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={layer.locked}
          className="text-muted-foreground rounded p-1 transition-colors hover:text-red-500 disabled:opacity-50"
          title="Delete"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </motion.div>
  );
};
