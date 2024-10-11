import { ny } from "~/lib/utils";
import { ActiveTool } from "../../types";
import { ToolSidebarHeader } from "../tool-sidebar/tool-sidebar-header";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";

interface SettingsSidebarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const SettingsSidebar = ({
  activeTool,
  onChangeActiveTool,
}: SettingsSidebarProps) => {
  const onClose = () => {
    onChangeActiveTool("select");
  };

  return (
    <div className="relative">
      <aside
        style={{ zIndex: 20 }}
        className={ny(
          "absolute z-[40] flex h-full w-[360px] flex-col border-r bg-white",
          activeTool === "settings" ? "visible" : "hidden",
        )}
      >
        <ToolSidebarHeader
          title="Settings"
          description="Configure canvas settings"
        />
        <ToolSidebarClose onClick={onClose} />
      </aside>
    </div>
  );
};
