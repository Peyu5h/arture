import { ny } from "~/lib/utils";
import { ActiveTool } from "../../../../lib/types";
import { ToolSidebarHeader } from "../tool-sidebar/tool-sidebar-header";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { SidebarBase } from "../tool-sidebar/sidebarBase";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Sparkles, Wand2, Brain, Zap } from "lucide-react";

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
    <SidebarBase isVisible={activeTool === "ai"} onClose={onClose}>
      <ToolSidebarHeader
        title="AI Tools"
        description="Enhance your design with AI"
      />

      <ScrollArea>
        <div className="space-y-4 p-4">
          <Button className="w-full gap-2" disabled>
            <Sparkles className="h-4 w-4" />
            AI Image Generator
          </Button>

          <Button className="w-full gap-2" variant="secondary" disabled>
            <Wand2 className="h-4 w-4" />
            Magic Remove Background
          </Button>

          <Button className="w-full gap-2" variant="outline" disabled>
            <Brain className="h-4 w-4" />
            Smart Color Palette
          </Button>

          <Button className="w-full gap-2" variant="ghost" disabled>
            <Zap className="h-4 w-4" />
            Auto Layout
          </Button>
        </div>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />
    </SidebarBase>
  );
};
