import { ny } from "~/lib/utils";
import { ActiveTool, Editor } from "../../types";
import { ToolSidebarHeader } from "../tool-sidebar/tool-sidebar-header";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";

interface TextSidebarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  editor: Editor;
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
        <ScrollArea>
          <div className="space-y-4 border-b p-4">
            <Button
              className="w-full"
              onClick={() => editor?.addText("Textbox")}
            >
              Add a textbox
            </Button>
            <Button
              className="h-16 w-full"
              variant="secondary"
              size="lg"
              onClick={() =>
                editor?.addText("Heading", {
                  fontSize: 80,
                  fontWeight: 700,
                })
              }
            >
              <span className="text-3xl font-bold">Add a heading</span>
            </Button>
            <Button
              className="h-16 w-full"
              variant="secondary"
              size="lg"
              onClick={() =>
                editor?.addText("Subheading", {
                  fontSize: 44,
                  fontWeight: 600,
                })
              }
            >
              <span className="text-xl font-semibold">Add a subheading</span>
            </Button>
            <Button
              className="h-16 w-full"
              variant="secondary"
              size="lg"
              onClick={() =>
                editor?.addText("Paragraph", {
                  fontSize: 32,
                })
              }
            >
              Paragraph
            </Button>
          </div>
        </ScrollArea>
      </aside>
    </div>
  );
};
