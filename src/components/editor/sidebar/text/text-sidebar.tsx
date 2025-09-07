import { ny } from "~/lib/utils";
import { Editor, ActiveTool } from "../../../../lib/types";
import { ToolSidebarHeader } from "../tool-sidebar/tool-sidebar-header";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { SidebarBase } from "../tool-sidebar/sidebarBase";
import { Type, Heading1, Heading2, AlignLeft } from "lucide-react";

interface TextSidebarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  editor: Editor | any;
}

export const TextSidebar = ({
  activeTool,
  onChangeActiveTool,
  editor,
}: TextSidebarProps) => {
  const onClose = () => {
    onChangeActiveTool("select");
  };

  return (
    <SidebarBase isVisible={activeTool === "text"} onClose={onClose}>
      <ToolSidebarHeader
        title="Text"
        description="Add text elements to your canvas"
      />

      <ScrollArea>
        <div className="space-y-4 border-b p-4">
          <Button
            className="w-full gap-2"
            onClick={() => editor?.addText("Textbox")}
          >
            <Type className="h-4 w-4" />
            Add a textbox
          </Button>
          <Button
            className="h-16 w-full gap-2"
            variant="secondary"
            size="lg"
            onClick={() =>
              editor?.addText("Heading", {
                fontSize: 80,
                fontWeight: 700,
              })
            }
          >
            <Heading1 className="h-5 w-5" />
            <span className="text-3xl font-bold">Add a heading</span>
          </Button>
          <Button
            className="h-16 w-full gap-2"
            variant="secondary"
            size="lg"
            onClick={() =>
              editor?.addText("Subheading", {
                fontSize: 44,
                fontWeight: 600,
              })
            }
          >
            <Heading2 className="h-4 w-4" />
            <span className="text-xl font-semibold">Add a subheading</span>
          </Button>
          <Button
            className="h-16 w-full gap-2"
            variant="secondary"
            size="lg"
            onClick={() =>
              editor?.addText("Paragraph", {
                fontSize: 32,
              })
            }
          >
            <AlignLeft className="h-4 w-4" />
            Paragraph
          </Button>
        </div>
      </ScrollArea>
      <ToolSidebarClose onClick={onClose} />
    </SidebarBase>
  );
};
