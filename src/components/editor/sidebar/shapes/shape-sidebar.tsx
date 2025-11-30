import { IoTriangle } from "react-icons/io5";
import { FaDiamond } from "react-icons/fa6";
import { FaCircle, FaSquare, FaSquareFull } from "react-icons/fa";
import { ScrollArea } from "~/components/ui/scroll-area";
import { ActiveTool } from "../../../../lib/types";
import { ToolSidebarHeader } from "../tool-sidebar/tool-sidebar-header";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { SidebarBase } from "../tool-sidebar/sidebarBase";
import { Hexagon } from "lucide-react";
import { motion } from "framer-motion";
import { ny } from "~/lib/utils";
import { useDragContext } from "~/contexts/drag-context";

interface ShapeSidebarProps {
  editor: any;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

interface ShapeItemProps {
  icon: React.ReactNode;
  label: string;
  shapeType: string;
  onClick: () => void;
}

const ShapeItem = ({ icon, label, shapeType, onClick }: ShapeItemProps) => {
  const { startDrag } = useDragContext();

  const handleMouseDown = (e: React.MouseEvent) => {
    startDrag(e, {
      type: "shape",
      data: { shapeType },
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startDrag(e, {
      type: "shape",
      data: { shapeType },
    });
  };

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={ny(
        "group border-border bg-card relative flex cursor-grab flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all active:cursor-grabbing",
        "hover:border-primary/50 select-none hover:shadow-md",
      )}
    >
      <div className="bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary pointer-events-none flex size-12 items-center justify-center rounded-lg transition-colors">
        {icon}
      </div>
      <span className="text-muted-foreground group-hover:text-foreground pointer-events-none text-xs font-medium">
        {label}
      </span>
    </motion.button>
  );
};

export const ShapeSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: ShapeSidebarProps) => {
  const onClose = () => {
    onChangeActiveTool("select");
  };

  return (
    <SidebarBase isVisible={activeTool === "shapes"} onClose={onClose}>
      <ToolSidebarHeader
        title="Shapes"
        description="add shapes to canvas"
        icon={Hexagon}
      />

      <ScrollArea className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-4"
        >
          <div className="space-y-3">
            <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Basic Shapes
            </span>
            <p className="text-muted-foreground -mt-1 text-[10px]">
              click or drag onto canvas
            </p>
            <div className="grid grid-cols-3 gap-3">
              <ShapeItem
                icon={<FaCircle className="size-6" />}
                label="Circle"
                shapeType="circle"
                onClick={() => editor?.addCircle()}
              />
              <ShapeItem
                icon={<FaSquare className="size-6" />}
                label="Rounded"
                shapeType="softRectangle"
                onClick={() => editor?.addSoftRectangle()}
              />
              <ShapeItem
                icon={<FaSquareFull className="size-6" />}
                label="Rectangle"
                shapeType="rectangle"
                onClick={() => editor?.addRectangle()}
              />
              <ShapeItem
                icon={<IoTriangle className="size-6" />}
                label="Triangle"
                shapeType="triangle"
                onClick={() => editor?.addTriangle()}
              />
              <ShapeItem
                icon={<IoTriangle className="size-6 rotate-180" />}
                label="Inv Triangle"
                shapeType="inverseTriangle"
                onClick={() => editor?.addInverseTriangle()}
              />
              <ShapeItem
                icon={<FaDiamond className="size-6" />}
                label="Diamond"
                shapeType="diamond"
                onClick={() => editor?.addDiamond()}
              />
            </div>
          </div>
        </motion.div>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />
    </SidebarBase>
  );
};
