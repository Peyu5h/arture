import { useState } from "react";
import { ActiveTool, Editor, EditorProps } from "./types";
import { Hint } from "../hintToolTip";
import { Button } from "../ui/button";
import { ny } from "~/lib/utils";

interface ToolbarProps {
  editor?: EditorProps;
  activeTool: ActiveTool;
  onChangeActiveTool: (value: ActiveTool) => void;
}

export const Toolbar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: ToolbarProps) => {
  const fillColor = editor?.fillColor;

  return (
    <div className="z-[15] flex h-[56px] w-full shrink-0 items-center gap-x-2 overflow-x-auto border-b bg-white p-2">
      <div className="flex h-full w-full items-center justify-between">
        <Hint label="Color" side="bottom">
          <Button
            size="icon"
            className={ny(activeTool == "fill" && "bg-gray-100")}
            variant="ghost"
            onClick={() => onChangeActiveTool("fill")}
          >
            <div
              className="size-4 rounded-sm"
              style={{
                backgroundColor:
                  typeof fillColor === "string" ? fillColor : "black",
              }}
            ></div>
          </Button>
        </Hint>
      </div>
    </div>
  );
};
