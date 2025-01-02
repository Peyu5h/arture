import { ny } from "~/lib/utils";
import { Editor, ActiveTool, fonts } from "../../types";
import { ToolSidebarHeader } from "../tool-sidebar/tool-sidebar-header";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { SidebarBase } from "../tool-sidebar/sidebarBase";
import { ToolsSidebarBase } from "../tool-sidebar/toolsSidebarBase";

interface FontSidebarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  editor: Editor | undefined;
}

export const FontSidebar = ({
  activeTool,
  onChangeActiveTool,
  editor,
}: FontSidebarProps) => {
  const value = editor?.getActiveFontFamily();
  const onClose = () => {
    onChangeActiveTool("select");
  };

  return (
    <ToolsSidebarBase isVisible={activeTool === "font"} onClose={onClose}>
      <ToolSidebarHeader title="Font" description="Change the text font" />
      <ScrollArea>
        <div className="mb-12 space-y-1 border-b p-4">
          {fonts.map((font) => (
            <Button
              key={font}
              variant="secondary"
              size="lg"
              className={ny(
                "h-16 w-full justify-start text-left",
                value === font && "border-2 border-blue-500",
              )}
              style={{
                fontFamily: font,
                fontSize: "16px",
                padding: "8px 16px",
              }}
              onClick={() => editor?.changeFontFamily(font)}
            >
              {font}
            </Button>
          ))}
        </div>
      </ScrollArea>
      <ToolSidebarClose onClick={onClose} />
    </ToolsSidebarBase>
  );
};
