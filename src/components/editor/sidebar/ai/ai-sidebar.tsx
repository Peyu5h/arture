import { ActiveTool } from "../../../../lib/types";
import { ToolSidebarHeader } from "../tool-sidebar/tool-sidebar-header";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { SidebarBase } from "../tool-sidebar/sidebarBase";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Sparkles,
  Wand2,
  Brain,
  ImagePlus,
  Palette,
  Type,
  LayoutGrid,
} from "lucide-react";
import { motion } from "framer-motion";
import { ny } from "~/lib/utils";

interface AISidebarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  editor?: any;
}

interface AIToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  disabled?: boolean;
  onClick?: () => void;
}

const AIToolCard = ({
  title,
  description,
  icon,
  badge,
  disabled = false,
  onClick,
}: AIToolCardProps) => {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.01 }}
      whileTap={disabled ? {} : { scale: 0.99 }}
      onClick={onClick}
      disabled={disabled}
      className={ny(
        "group relative w-full overflow-hidden rounded-xl border p-4 text-left transition-all",
        disabled
          ? "border-border bg-muted/30 cursor-not-allowed opacity-60"
          : "border-border bg-card hover:border-primary/50 hover:shadow-md",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={ny(
            "flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors",
            disabled
              ? "bg-muted/50 text-muted-foreground"
              : "bg-primary/10 text-primary group-hover:bg-primary/20",
          )}
        >
          {icon}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">{title}</h3>
            {badge && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                {badge}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
      </div>
    </motion.button>
  );
};

const aiTools = [
  {
    id: "generate-image",
    title: "Generate Image",
    description: "create images from text descriptions",
    icon: <ImagePlus className="size-5" />,
    badge: "soon",
    disabled: true,
  },
  {
    id: "remove-bg",
    title: "Remove Background",
    description: "automatically remove image backgrounds",
    icon: <Wand2 className="size-5" />,
    badge: "soon",
    disabled: true,
  },
  {
    id: "smart-palette",
    title: "Smart Color Palette",
    description: "generate harmonious color schemes",
    icon: <Palette className="size-5" />,
    badge: "soon",
    disabled: true,
  },
  {
    id: "auto-layout",
    title: "Auto Layout",
    description: "intelligently arrange design elements",
    icon: <LayoutGrid className="size-5" />,
    badge: "soon",
    disabled: true,
  },
  {
    id: "text-enhance",
    title: "Enhance Text",
    description: "improve and rewrite your copy",
    icon: <Type className="size-5" />,
    badge: "soon",
    disabled: true,
  },
  {
    id: "style-transfer",
    title: "Style Transfer",
    description: "apply artistic styles to images",
    icon: <Brain className="size-5" />,
    badge: "soon",
    disabled: true,
  },
];

export const AISidebar = ({
  activeTool,
  onChangeActiveTool,
  editor,
}: AISidebarProps) => {
  const onClose = () => {
    onChangeActiveTool("select");
  };

  return (
    <SidebarBase isVisible={activeTool === "ai"} onClose={onClose}>
      <ToolSidebarHeader
        title="AI Tools"
        description="enhance your design with ai"
        icon={Sparkles}
      />

      <ScrollArea className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6 p-4"
        >
          <div className="space-y-3">
            <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              AI Assistant
            </span>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="group border-primary/30 from-primary/10 via-primary/5 hover:border-primary/50 relative w-full overflow-hidden rounded-xl border bg-gradient-to-br to-transparent p-4 text-left transition-all hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="bg-primary/20 relative flex size-12 shrink-0 items-center justify-center rounded-xl">
                  <Sparkles className="text-primary size-6" />
                  <div className="absolute -top-1 -right-1 size-3 animate-pulse rounded-full bg-green-500" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Design Assistant</h3>
                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600">
                      beta
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    chat with ai to create and edit your designs using natural
                    language
                  </p>
                </div>
              </div>

              <div className="bg-primary/10 absolute -right-8 -bottom-8 size-24 rounded-full blur-2xl transition-transform group-hover:scale-150" />
            </motion.button>
          </div>

          <div className="bg-border h-px" />

          <div className="space-y-3">
            <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              AI Tools
            </span>

            <div className="space-y-2">
              {aiTools.map((tool, index) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                >
                  <AIToolCard
                    title={tool.title}
                    description={tool.description}
                    icon={tool.icon}
                    badge={tool.badge}
                    disabled={tool.disabled}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />
    </SidebarBase>
  );
};
