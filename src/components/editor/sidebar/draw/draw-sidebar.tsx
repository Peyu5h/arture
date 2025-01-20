import { ActiveTool, Editor, STROKE_COLOR, STROKE_WIDTH } from "../../types";
import { ToolSidebarHeader } from "../tool-sidebar/tool-sidebar-header";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { ScrollArea } from "~/components/ui/scroll-area";
import { SidebarBase } from "../tool-sidebar/sidebarBase";
import { Slider } from "~/components/slider";
import { ColorPicker } from "../fillColor/colorPicker";
import { Label } from "~/components/label";

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

  return (
    <SidebarBase isVisible={activeTool === "draw"} onClose={onClose}>
      <ToolSidebarHeader
        title="Draw"
        description="Draw freely on your canvas"
      />

      <ScrollArea>
        <div className="space-y-6 border-b p-4">
          <Label className="text-sm">Brush width</Label>
          <Slider
            value={[widthValue]}
            onValueChange={(values) => onWidthChange(values[0])}
          />
        </div>
        <div className="space-y-6 p-4">
          <ColorPicker
            value={typeof colorValue === "string" ? colorValue : STROKE_COLOR}
            onChange={onColorChange}
          />
        </div>
      </ScrollArea>
      <ToolSidebarClose onClick={onClose} />
    </SidebarBase>
  );
};
