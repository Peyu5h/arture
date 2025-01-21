import {
  ActiveTool,
  Editor,
  STROKE_COLOR,
  STROKE_WIDTH,
} from "../../../../lib/types";
import { ToolSidebarHeader } from "../tool-sidebar/tool-sidebar-header";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { ScrollArea } from "~/components/ui/scroll-area";
import { SidebarBase } from "../tool-sidebar/sidebarBase";
import { Slider } from "~/components/ui/slider";
import { ColorPicker } from "../fillColor/colorPicker";
import { Label } from "~/components/ui/label";

interface DrawSidebarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  editor: Editor | undefined;
}

export const DrawSidebar = ({
  activeTool,
  onChangeActiveTool,
  editor,
}: DrawSidebarProps) => {
  const onClose = () => {
    onChangeActiveTool("select");
  };

  const colorValue = editor?.getActiveStrokeColor() || STROKE_COLOR;
  const widthValue = editor?.getActiveStrokeWidth() || STROKE_WIDTH;

  const onColorChange = (value: string) => {
    editor?.changeStrokeColor(value);
  };

  const onWidthChange = (value: number) => {
    editor?.changeStrokeWidth(value);
  };

  const value = editor?.getActiveFillColor?.();
  const backgroundColorValue = typeof value === "string" ? value : "#000000";

  return (
    <SidebarBase isVisible={activeTool === "draw"} onClose={onClose}>
      <ToolSidebarHeader
        title="Draw"
        description="Draw freely on your canvas"
      />

      <div className="flex h-[80vh] flex-col gap-4 p-4">
        <ScrollArea className="h-full pb-4 pr-2">
          <div className="space-y-2 pb-6 pt-4">
            <Label className="text-sm">Brush width</Label>
            <Slider
              value={[widthValue]}
              onValueChange={(values) => onWidthChange(values[0])}
            />
          </div>
          <div className="space-y-6">
            <ColorPicker
              canvas={editor?.canvas}
              value={backgroundColorValue}
              onChange={onColorChange}
            />
          </div>
        </ScrollArea>
      </div>

      <ToolSidebarClose onClick={onClose} />
    </SidebarBase>
  );
};
