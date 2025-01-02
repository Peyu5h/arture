import { useState } from "react";
import { ActiveTool, Editor } from "./types";
import { Hint } from "../hintToolTip";
import { Button } from "../ui/button";
import { ny } from "~/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";
import { BsBorderWidth } from "react-icons/bs";
import { RxTransparencyGrid } from "react-icons/rx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Slider } from "../slider";

interface ToolbarProps {
  editor?: Editor;
  activeTool: ActiveTool;
  onChangeActiveTool: (value: ActiveTool) => void;
}

export const Toolbar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: ToolbarProps) => {
  const [opacity, setOpacity] = useState(editor?.getActiveOpacity() || 1);
  const fillColor = editor?.getActiveFillColor?.() || "#000000";
  const strokeColor = editor?.getActiveStrokeColor?.() || "#000000";

  const cssFillColor = typeof fillColor === "string" ? fillColor : "#000000";
  const cssStrokeColor =
    typeof strokeColor === "string" ? strokeColor : "#000000";

  const handleOpacityChange = (value: number[]) => {
    const newOpacity = value[0];
    setOpacity(newOpacity);
    editor?.changeOpacity?.(newOpacity);
  };

  const selectedObject = editor?.canvas?.getActiveObject();
  const isTextObject = selectedObject?.type === "text";
  return (
    <div className="z-[15] flex h-[56px] w-full shrink-0 items-center gap-x-2 overflow-x-auto border-b bg-white p-2">
      <div className="flex h-full items-center justify-between">
        <Hint label="Color" side="bottom">
          <Button
            size="icon"
            className={ny(activeTool == "fill" && "bg-gray-100")}
            variant="ghost"
            onClick={() => onChangeActiveTool("fill")}
          >
            <div
              className="size-4 rounded-sm border border-gray-200"
              style={{ backgroundColor: cssFillColor }}
            ></div>
          </Button>
        </Hint>
      </div>
      {!isTextObject && (
        <div className="flex h-full items-center justify-between">
          <Hint label="Stroke" side="bottom">
            <Button
              size="icon"
              className={ny(activeTool == "strokeColor" && "bg-gray-100")}
              variant="ghost"
              onClick={() => onChangeActiveTool("strokeColor")}
            >
              <BsBorderWidth size={20} />
            </Button>
          </Hint>
        </div>
      )}

      <div className="flex h-full items-center justify-between">
        <Hint label="Bring forward" side="bottom">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor?.bringForward()}
          >
            <ArrowUp size={20} />
          </Button>
        </Hint>
      </div>
      <div className="flex h-full items-center justify-between">
        <Hint label="Send backward" side="bottom">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => editor?.sendBackward()}
          >
            <ArrowDown size={20} />
          </Button>
        </Hint>
      </div>
      <div className="flex h-full items-center justify-between">
        <DropdownMenu>
          <Hint label="Opacity" side="bottom">
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="relative">
                <RxTransparencyGrid size={20} />
              </Button>
            </DropdownMenuTrigger>
          </Hint>
          <DropdownMenuContent className="w-80 p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Opacity</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(opacity * 100)}%
                </span>
              </div>
              <Slider
                value={[opacity]}
                onValueChange={handleOpacityChange}
                min={0}
                max={1}
                step={0.01}
                className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
