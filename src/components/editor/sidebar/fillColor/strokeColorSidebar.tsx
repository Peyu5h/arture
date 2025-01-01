import { ny } from "~/lib/utils";
import { ActiveTool, Editor } from "../../types";
import { ToolSidebarHeader } from "../tool-sidebar/tool-sidebar-header";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { StrokeWidthControl } from "./strokeWidthControl";
import { Separator } from "~/components/ui/separator";
import { BorderColorPicker } from "./borderColorPicker";

interface StrokeColorSidebarProps {
  editor: Editor | undefined;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const StrokeColorSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: StrokeColorSidebarProps) => {
  const value = editor?.getActiveStrokeColor();
  const backgroundColorValue = typeof value === "string" ? value : "#000000";
  const strokeWidth = editor?.strokeWidth || 2;
  const strokeType = editor?.strokeType || "solid";

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const onStrokeTypeChange = (type: "solid" | "dashed") => {
    editor?.changeStrokeType?.(type);
  };

  const onChange = (value: string) => {
    editor?.changeStrokeColor(value);
  };

  const onStrokeWidthChange = (value: number) => {
    editor?.changeStrokeWidth(value);
  };

  return (
    <aside
      className={ny(
        "absolute z-[40] flex h-full w-[360px] flex-col border-r bg-white shadow-lg",
        activeTool === "strokeColor" ? "visible" : "hidden",
      )}
    >
      <ToolSidebarHeader
        title="Stroke"
        description="Customize stroke properties"
      />

      <ScrollArea className="flex-1">
        <div className="space-y-6 p-6">
          <div className="space-y-6">
            <StrokeWidthControl
              value={strokeWidth}
              onChange={onStrokeWidthChange}
              strokeType={strokeType}
              onStrokeTypeChange={onStrokeTypeChange}
            />
            <Separator />
            <BorderColorPicker
              value={backgroundColorValue}
              onChange={onChange}
            />
          </div>
        </div>
      </ScrollArea>
      <ToolSidebarClose onClick={onClose} />
    </aside>
  );
};
