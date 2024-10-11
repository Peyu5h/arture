import { ny } from "~/lib/utils";
import { ActiveTool } from "../../types";
import { ToolSidebarHeader } from "../tool-sidebar/tool-sidebar-header";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";

interface TextSidebarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const TextSidebar = ({
  activeTool,
  onChangeActiveTool,
}: TextSidebarProps) => {
  const onClose = () => {
    onChangeActiveTool("select");
  };

  return (
    <div className="relative">
      <aside
        style={{ zIndex: 20 }}
        className={ny(
          "absolute z-[40] flex h-full w-[360px] flex-col border-r bg-white",
          activeTool === "text" ? "visible" : "hidden",
        )}
      >
        <ToolSidebarHeader title="Text" description="Add text to your canvas" />
        <ToolSidebarClose onClick={onClose} />
      </aside>
    </div>
  );
};
