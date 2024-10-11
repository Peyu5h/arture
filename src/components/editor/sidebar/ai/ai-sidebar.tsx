import { ny } from "~/lib/utils";
import { ActiveTool } from "../../types";
import { ToolSidebarHeader } from "../tool-sidebar/tool-sidebar-header";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";

interface AISidebarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const AISidebar = ({
  activeTool,
  onChangeActiveTool,
}: AISidebarProps) => {
  const onClose = () => {
    onChangeActiveTool("select");
  };

  return (
    <div className="relative">
      <aside
        style={{ zIndex: 20 }}
        className={ny(
          "absolute z-[40] flex h-full w-[360px] flex-col border-r bg-white",
          activeTool === "ai" ? "visible" : "hidden",
        )}
      >
        <ToolSidebarHeader
          title="AI"
          description="Use AI tools on your canvas"
        />
        <ToolSidebarClose onClick={onClose} />
      </aside>
    </div>
  );
};
