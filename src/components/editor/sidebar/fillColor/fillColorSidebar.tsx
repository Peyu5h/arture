import { ny } from "~/lib/utils";
import { ActiveTool, Editor, FILL_COLOR } from "../../types";
import { ToolSidebarHeader } from "../tool-sidebar/tool-sidebar-header";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { ColorPicker } from "./colorPicker";
import { ToolsSidebarBase } from "../tool-sidebar/toolsSidebarBase";

interface FillColorSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const FillColorSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: FillColorSidebarProps) => {
  const value = editor?.getActiveFillColor?.();
  const backgroundColorValue = typeof value === "string" ? value : "#000000";

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const onChange = (value: string) => {
    editor?.changeFillColor(value);
  };

  return (
    <ToolsSidebarBase isVisible={activeTool === "fill"} onClose={onClose}>
      <ToolSidebarHeader
        title="Fill color"
        description="Add fill color to your element"
      />
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <div
          className="size-6 rounded-sm"
          style={{ backgroundColor: backgroundColorValue }}
        />
        <span className="text-sm">{backgroundColorValue}</span>
      </div>
      <ScrollArea>
        <div className="space-y-6 p-4">
          <ColorPicker value={backgroundColorValue} onChange={onChange} />
        </div>
      </ScrollArea>
      <ToolSidebarClose onClick={onClose} />
    </ToolsSidebarBase>
  );
};
