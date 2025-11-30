import { useState } from "react";
import { ActiveTool, STROKE_COLOR, STROKE_WIDTH } from "../../../../lib/types";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { ScrollArea } from "~/components/ui/scroll-area";
import { SidebarBase } from "../tool-sidebar/sidebarBase";
import { motion } from "framer-motion";
import {
  BrushToolSelector,
  BrushType,
  StrokeSizeControl,
  ColorPalette,
} from "./components";

interface DrawSidebarProps {
  onChangeActiveTool: (tool: ActiveTool) => void;
  editor: any;
  activeTool: ActiveTool;
}

export const DrawSidebar = ({
  activeTool,
  onChangeActiveTool,
  editor,
}: DrawSidebarProps) => {
  const [brushType, setBrushType] = useState<BrushType>("pen");

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const colorValue = editor?.getActiveStrokeColor() || STROKE_COLOR;
  const widthValue = editor?.getActiveStrokeWidth() || STROKE_WIDTH;

  const onColorChange = (value: string) => {
    editor?.changeStrokeColor(value);
    // reapply brush type to update color in brush
    editor?.setBrushType(brushType);
  };

  const onWidthChange = (value: number) => {
    editor?.changeStrokeWidth(value);
    // reapply brush type to update width in brush
    editor?.setBrushType(brushType);
  };

  // brush type effects
  const handleBrushTypeChange = (type: BrushType) => {
    setBrushType(type);
    editor?.setBrushType(type);

    // apply brush-specific default widths
    switch (type) {
      case "pen":
        if (widthValue < 2) editor?.changeStrokeWidth(2);
        break;
      case "pencil":
        if (widthValue < 1) editor?.changeStrokeWidth(1);
        break;
      case "marker":
        if (widthValue < 8) editor?.changeStrokeWidth(8);
        break;
      case "highlighter":
        if (widthValue < 16) editor?.changeStrokeWidth(16);
        break;
    }
  };

  return (
    <SidebarBase isVisible={activeTool === "draw"} onClose={onClose}>
      {/* header */}
      <div className="border-border bg-card border-b select-none">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex size-9 items-center justify-center rounded-lg">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary size-5"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold">Draw</h2>
              <p className="text-muted-foreground text-xs">
                freehand drawing tools
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* content */}
      <ScrollArea className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6 p-4 select-none"
        >
          {/* brush type selector */}
          <BrushToolSelector
            value={brushType}
            onChange={handleBrushTypeChange}
          />

          {/* divider */}
          <div className="bg-border h-px" />

          {/* stroke size control */}
          <StrokeSizeControl
            value={widthValue}
            onChange={onWidthChange}
            min={1}
            max={50}
            color={colorValue}
          />

          {/* divider */}
          <div className="bg-border h-px" />

          {/* color palette */}
          <ColorPalette
            value={colorValue}
            onChange={onColorChange}
            canvas={editor?.canvas}
          />
        </motion.div>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />
    </SidebarBase>
  );
};
