import { motion } from "framer-motion";
import { ny } from "~/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export type BrushType = "pen" | "pencil" | "marker" | "highlighter";

interface BrushTool {
  id: BrushType;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const brushTools: BrushTool[] = [
  {
    id: "pen",
    name: "Pen",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
      </svg>
    ),
    description: "smooth lines with pressure sensitivity",
  },
  {
    id: "pencil",
    name: "Pencil",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
        <path d="m15 5 4 4" />
      </svg>
    ),
    description: "natural texture strokes",
  },
  {
    id: "marker",
    name: "Marker",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
    description: "bold opaque strokes",
  },
  {
    id: "highlighter",
    name: "Highlighter",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <path d="m9 11-6 6v3h9l3-3" />
        <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
      </svg>
    ),
    description: "semi-transparent overlay",
  },
];

interface BrushToolSelectorProps {
  value: BrushType;
  onChange: (value: BrushType) => void;
}

export const BrushToolSelector = ({
  value,
  onChange,
}: BrushToolSelectorProps) => {
  return (
    <div className="space-y-3 select-none">
      <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        Brush Type
      </span>
      <TooltipProvider delayDuration={300}>
        <div className="grid grid-cols-4 gap-2">
          {brushTools.map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onChange(tool.id)}
                  className={ny(
                    "relative flex flex-col items-center justify-center gap-1.5 rounded-xl p-3 transition-all duration-200",
                    value === tool.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {value === tool.id && (
                    <motion.div
                      layoutId="brush-selector"
                      className="bg-primary absolute inset-0 rounded-xl"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }}
                    />
                  )}
                  <span className="relative z-10">{tool.icon}</span>
                  <span className="relative z-10 text-[10px] font-medium">
                    {tool.name}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" variant="outline">
                <p className="text-xs">{tool.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
};
