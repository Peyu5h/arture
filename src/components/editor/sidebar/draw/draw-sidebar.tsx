import { useState, useEffect } from "react";
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
  const [currentColor, setCurrentColor] = useState(STROKE_COLOR);
  const [currentWidth, setCurrentWidth] = useState(STROKE_WIDTH);

  // sync with editor on mount and when editor changes
  useEffect(() => {
    if (editor) {
      const editorColor = editor.getActiveStrokeColor?.();
      const editorWidth = editor.getActiveStrokeWidth?.();
      if (editorColor) setCurrentColor(editorColor);
      if (editorWidth) setCurrentWidth(editorWidth);
    }
  }, [editor]);

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const onColorChange = (value: string) => {
    setCurrentColor(value);
    editor?.changeStrokeColor(value);
    editor?.setBrushType(brushType);
  };

  const onWidthChange = (value: number) => {
    setCurrentWidth(value);
    editor?.changeStrokeWidth(value);
    editor?.setBrushType(brushType);
  };

  const handleBrushTypeChange = (type: BrushType) => {
    setBrushType(type);
    editor?.setBrushType(type);

    switch (type) {
      case "pen":
        if (currentWidth < 2) {
          setCurrentWidth(2);
          editor?.changeStrokeWidth(2);
        }
        break;
      case "pencil":
        if (currentWidth < 1) {
          setCurrentWidth(1);
          editor?.changeStrokeWidth(1);
        }
        break;
      case "marker":
        if (currentWidth < 8) {
          setCurrentWidth(8);
          editor?.changeStrokeWidth(8);
        }
        break;
      case "highlighter":
        if (currentWidth < 16) {
          setCurrentWidth(16);
          editor?.changeStrokeWidth(16);
        }
        break;
    }
  };

  return (
    <SidebarBase isVisible={activeTool === "draw"} onClose={onClose}>
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

      <ScrollArea className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6 p-4 select-none"
        >
          <BrushToolSelector
            value={brushType}
            onChange={handleBrushTypeChange}
          />

          <div className="bg-border h-px" />

          <StrokeSizeControl
            value={currentWidth}
            onChange={onWidthChange}
            min={1}
            max={50}
            color={currentColor}
          />

          <div className="bg-border h-px" />

          <ColorPalette
            value={currentColor}
            onChange={onColorChange}
            canvas={editor?.canvas}
          />
        </motion.div>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />
    </SidebarBase>
  );
};
