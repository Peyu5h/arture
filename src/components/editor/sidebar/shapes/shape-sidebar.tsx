import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Input } from "~/components/ui/input";
import { SidebarBase } from "../tool-sidebar/sidebarBase";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { ActiveTool } from "~/lib/types";
import { useDragContext } from "~/contexts/drag-context";
import { Search, X, ChevronLeft } from "lucide-react";
import { ny } from "~/lib/utils";
import { IoTriangle } from "react-icons/io5";
import { FaDiamond, FaStar } from "react-icons/fa6";
import {
  FaCircle,
  FaSquare,
  FaSquareFull,
  FaRegCircle,
  FaRegSquare,
  FaHeart,
} from "react-icons/fa";
import {
  Hexagon,
  Star,
  Heart,
  Minus,
  ArrowRight,
  ArrowLeftRight,
  Pentagon,
  Octagon,
  Triangle,
  Circle,
  Square,
  RectangleHorizontal,
} from "lucide-react";

interface ShapeSidebarProps {
  editor: any;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

interface ShapeItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  shapeType: string;
  action: () => void;
}

interface ShapeCardProps {
  shape: ShapeItem;
}

const ShapeCard = ({ shape }: ShapeCardProps) => {
  const { startDrag } = useDragContext();

  const handleMouseDown = (e: React.MouseEvent) => {
    startDrag(e, {
      type: "shape",
      data: { shapeType: shape.shapeType },
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startDrag(e, {
      type: "shape",
      data: { shapeType: shape.shapeType },
    });
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={shape.action}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={ny(
        "group relative flex cursor-grab flex-col items-center justify-center rounded-xl border p-3 transition-all active:cursor-grabbing",
        "border-border bg-card hover:border-primary/50 hover:shadow-md",
      )}
      title={shape.name}
    >
      <div className="text-muted-foreground group-hover:text-foreground flex size-10 items-center justify-center transition-colors">
        {shape.icon}
      </div>
      <span className="text-muted-foreground group-hover:text-foreground mt-1 text-[10px] font-medium">
        {shape.name}
      </span>
    </motion.button>
  );
};

interface CategoryRowProps {
  title: string;
  shapes: ShapeItem[];
}

const CategoryRow = ({ title, shapes }: CategoryRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const displayShapes = expanded ? shapes : shapes.slice(0, 4);
  const hasMore = shapes.length > 4;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-primary hover:text-primary/80 text-xs font-medium transition-colors"
          >
            {expanded ? "Show Less" : `Show All (${shapes.length})`}
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <AnimatePresence mode="popLayout">
          {displayShapes.map((shape) => (
            <motion.div
              key={shape.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              layout
            >
              <ShapeCard shape={shape} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const ShapeSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: ShapeSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filledShapes: ShapeItem[] = useMemo(
    () => [
      {
        id: "circle",
        name: "Circle",
        icon: <FaCircle className="size-6" />,
        shapeType: "circle",
        action: () => editor?.addCircle(),
      },
      {
        id: "square",
        name: "Square",
        icon: <FaSquareFull className="size-6" />,
        shapeType: "rectangle",
        action: () => editor?.addRectangle(),
      },
      {
        id: "rounded",
        name: "Rounded",
        icon: <FaSquare className="size-6" />,
        shapeType: "softRectangle",
        action: () => editor?.addSoftRectangle(),
      },
      {
        id: "triangle",
        name: "Triangle",
        icon: <IoTriangle className="size-6" />,
        shapeType: "triangle",
        action: () => editor?.addTriangle(),
      },
      {
        id: "diamond",
        name: "Diamond",
        icon: <FaDiamond className="size-6" />,
        shapeType: "diamond",
        action: () => editor?.addDiamond(),
      },
      {
        id: "pentagon",
        name: "Pentagon",
        icon: <Pentagon className="size-6" fill="currentColor" />,
        shapeType: "pentagon",
        action: () => editor?.addPentagon?.(),
      },
      {
        id: "hexagon",
        name: "Hexagon",
        icon: <Hexagon className="size-6" fill="currentColor" />,
        shapeType: "hexagon",
        action: () => editor?.addHexagon?.(),
      },
      {
        id: "octagon",
        name: "Octagon",
        icon: <Octagon className="size-6" fill="currentColor" />,
        shapeType: "octagon",
        action: () => editor?.addOctagon?.(),
      },
      {
        id: "star",
        name: "Star",
        icon: <FaStar className="size-6" />,
        shapeType: "star",
        action: () => editor?.addStar?.(),
      },
      {
        id: "heart",
        name: "Heart",
        icon: <FaHeart className="size-6" />,
        shapeType: "heart",
        action: () => editor?.addHeart?.(),
      },
    ],
    [editor],
  );

  const outlineShapes: ShapeItem[] = useMemo(
    () => [
      {
        id: "circle-outline",
        name: "Circle",
        icon: <FaRegCircle className="size-6" />,
        shapeType: "circle",
        action: () => editor?.addCircle(),
      },
      {
        id: "square-outline",
        name: "Square",
        icon: <FaRegSquare className="size-6" />,
        shapeType: "rectangle",
        action: () => editor?.addRectangle(),
      },
      {
        id: "triangle-outline",
        name: "Triangle",
        icon: <Triangle className="size-6" />,
        shapeType: "triangle",
        action: () => editor?.addTriangle(),
      },
      {
        id: "pentagon-outline",
        name: "Pentagon",
        icon: <Pentagon className="size-6" strokeWidth={1.5} />,
        shapeType: "pentagon",
        action: () => editor?.addPentagon?.(),
      },
      {
        id: "hexagon-outline",
        name: "Hexagon",
        icon: <Hexagon className="size-6" strokeWidth={1.5} />,
        shapeType: "hexagon",
        action: () => editor?.addHexagon?.(),
      },
      {
        id: "star-outline",
        name: "Star",
        icon: <Star className="size-6" strokeWidth={1.5} />,
        shapeType: "star",
        action: () => editor?.addStar?.(),
      },
    ],
    [editor],
  );

  const lineShapes: ShapeItem[] = useMemo(
    () => [
      {
        id: "line",
        name: "Line",
        icon: <Minus className="size-6" />,
        shapeType: "line",
        action: () => editor?.addLine?.(),
      },
      {
        id: "arrow",
        name: "Arrow",
        icon: <ArrowRight className="size-6" />,
        shapeType: "arrow",
        action: () => editor?.addArrow?.(),
      },
      {
        id: "double-arrow",
        name: "Double",
        icon: <ArrowLeftRight className="size-6" />,
        shapeType: "doubleArrow",
        action: () => editor?.addDoubleArrow?.(),
      },
    ],
    [editor],
  );

  const allShapes = useMemo(
    () => [...filledShapes, ...outlineShapes, ...lineShapes],
    [filledShapes, outlineShapes, lineShapes],
  );

  const filteredShapes = useMemo(() => {
    if (!searchQuery) return null;
    return allShapes.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, allShapes]);

  const onClose = () => {
    onChangeActiveTool("select");
  };

  return (
    <SidebarBase isVisible={activeTool === "shapes"} onClose={onClose}>
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-base font-semibold">Shapes</h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-1.5 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="border-border border-b p-4">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search shapes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-muted/50 border-0 pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-4"
        >
          {filteredShapes ? (
            filteredShapes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground text-sm">No shapes found</p>
                <p className="text-muted-foreground/70 text-xs">
                  Try a different search term
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
                  >
                    <ChevronLeft className="size-4" />
                    Back
                  </button>
                  <span className="text-muted-foreground text-xs">
                    {filteredShapes.length} results
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {filteredShapes.map((shape) => (
                    <ShapeCard key={shape.id} shape={shape} />
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="space-y-6">
              <CategoryRow title="Filled" shapes={filledShapes} />
              <CategoryRow title="Outline" shapes={outlineShapes} />
              <CategoryRow title="Lines & Arrows" shapes={lineShapes} />
            </div>
          )}
        </motion.div>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />
    </SidebarBase>
  );
};
