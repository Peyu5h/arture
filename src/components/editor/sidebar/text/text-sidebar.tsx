import { ActiveTool } from "../../../../lib/types";
import { ToolSidebarHeader } from "../tool-sidebar/tool-sidebar-header";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { ScrollArea } from "~/components/ui/scroll-area";
import { SidebarBase } from "../tool-sidebar/sidebarBase";
import { Type, Heading1, Heading2, AlignLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useDragContext } from "~/contexts/drag-context";

interface TextSidebarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  editor: any;
}

interface TextOptionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  preview: React.ReactNode;
  textType: string;
  textOptions: Record<string, any>;
  onClick: () => void;
}

const TextOption = ({
  title,
  description,
  icon,
  preview,
  textType,
  textOptions,
  onClick,
}: TextOptionProps) => {
  const { startDrag } = useDragContext();

  const handleMouseDown = (e: React.MouseEvent) => {
    startDrag(e, {
      type: "text",
      data: { textType, options: textOptions },
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startDrag(e, {
      type: "text",
      data: { textType, options: textOptions },
    });
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className="group border-border bg-card hover:border-primary/50 relative w-full cursor-grab overflow-hidden rounded-xl border p-4 text-left transition-all select-none hover:shadow-md active:cursor-grabbing"
    >
      <div className="flex items-start gap-3">
        <div className="bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary pointer-events-none flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors">
          {icon}
        </div>
        <div className="pointer-events-none flex-1 space-y-1">
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
      </div>
      <div className="bg-muted/30 pointer-events-none mt-3 flex items-center justify-center rounded-lg p-3">
        {preview}
      </div>
    </motion.button>
  );
};

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
        description="add text elements to canvas"
        icon={Type}
      />

      <ScrollArea className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3 p-4"
        >
          <p className="text-muted-foreground text-[10px]">
            click or drag onto canvas
          </p>

          <TextOption
            title="Heading"
            description="large bold text for titles"
            icon={<Heading1 className="size-5" />}
            preview={
              <span className="text-2xl font-bold tracking-tight">Heading</span>
            }
            textType="heading"
            textOptions={{
              text: "Heading",
              fontSize: 80,
              fontWeight: 700,
            }}
            onClick={() =>
              editor?.addText("Heading", {
                fontSize: 80,
                fontWeight: 700,
              })
            }
          />

          <TextOption
            title="Subheading"
            description="medium text for sections"
            icon={<Heading2 className="size-5" />}
            preview={<span className="text-lg font-semibold">Subheading</span>}
            textType="subheading"
            textOptions={{
              text: "Subheading",
              fontSize: 44,
              fontWeight: 600,
            }}
            onClick={() =>
              editor?.addText("Subheading", {
                fontSize: 44,
                fontWeight: 600,
              })
            }
          />

          <TextOption
            title="Body Text"
            description="regular paragraph text"
            icon={<AlignLeft className="size-5" />}
            preview={<span className="text-sm">Body text paragraph</span>}
            textType="body"
            textOptions={{
              text: "Paragraph",
              fontSize: 32,
            }}
            onClick={() =>
              editor?.addText("Paragraph", {
                fontSize: 32,
              })
            }
          />

          <TextOption
            title="Custom Text"
            description="start with a blank textbox"
            icon={<Type className="size-5" />}
            preview={
              <span className="text-muted-foreground text-sm italic">
                Type something...
              </span>
            }
            textType="custom"
            textOptions={{
              text: "Textbox",
            }}
            onClick={() => editor?.addText("Textbox")}
          />
        </motion.div>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />
    </SidebarBase>
  );
};
