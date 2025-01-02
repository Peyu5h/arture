import { ny } from "~/lib/utils";
import { ActiveTool } from "../../types";
import { ToolSidebarHeader } from "../tool-sidebar/tool-sidebar-header";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { ShapeTool } from "./shape-tool";

import { IoTriangle } from "react-icons/io5";
import { FaDiamond } from "react-icons/fa6";
import { FaCircle, FaSquare, FaSquareFull } from "react-icons/fa";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useEditor } from "~/hooks/useEditor";
import { useCallback } from "react";

interface ShapeSidebarProps {
  editor: any;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const ShapeSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: ShapeSidebarProps) => {
  const onClose = () => {
    onChangeActiveTool("select");
  };

  return (
    <div className="relative">
      <aside
        style={{ zIndex: 20 }}
        className={ny(
          "absolute z-[40] flex h-full w-[360px] flex-col border-r bg-white",
          activeTool === "shapes" ? "visible" : "hidden",
        )}
      >
        {/* <SidebarBase isVisible={activeTool === "shapes"} onClose={onClose}>
        <ToolSidebarHeader
          title="Shapes"
          description="Add shapes to your canvas"
        /> */}
        <ScrollArea>
          <div className="grid grid-cols-3 gap-4 p-4">
            <ShapeTool onClick={() => editor?.addCircle()} icon={FaCircle} />
            <ShapeTool
              onClick={() => {
                editor?.addSoftRectangle();
              }}
              icon={FaSquare}
            />
            <ShapeTool
              onClick={() => {
                editor?.addRectangle();
              }}
              icon={FaSquareFull}
            />
            <ShapeTool
              onClick={() => {
                editor?.addTriangle();
              }}
              icon={IoTriangle}
            />
            <ShapeTool
              onClick={() => {
                editor?.addInverseTriangle();
              }}
              icon={IoTriangle}
              iconClassName="rotate-180"
            />
            <ShapeTool
              onClick={() => {
                editor?.addDiamond();
              }}
              icon={FaDiamond}
            />
          </div>
        </ScrollArea>
        <ToolSidebarClose onClick={onClose} />
        {/* </SidebarBase> */}
      </aside>
    </div>
  );
};
