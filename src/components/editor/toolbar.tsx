import { useState } from "react";
import { ActiveTool, Editor, FONT_SIZE, FONT_WEIGHT } from "../../lib/types";
import { Hint } from "../hintToolTip";
import { Button } from "../ui/button";
import { ny } from "~/lib/utils";
import {
  ArrowUp,
  ArrowDown,
  ChevronDown,
  AlignRight,
  AlignLeft,
  AlignCenter,
  Minus,
  Plus,
  Trash2,
  Trash,
  Copy,
} from "lucide-react";
import { BsBorderWidth } from "react-icons/bs";
import { RxTransparencyGrid } from "react-icons/rx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Slider } from "../ui/slider";
import {
  FaBold,
  FaItalic,
  FaStrikethrough,
  FaUnderline,
} from "react-icons/fa6";
import { Input } from "../ui/input";

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

  const initialFillColor = editor?.getActiveFillColor();
  const initialStrokeColor = editor?.getActiveStrokeColor();
  const initialFontFamily = editor?.getActiveFontFamily() || "Arial";
  const initialFontWeight = editor?.getActiveFontWeight() || FONT_WEIGHT;
  const initialFontStyle = editor?.getActiveFontStyle();
  const initialFontLinethrough = editor?.getActiveFontLinethrough();
  const initialFontUnderline = editor?.getActiveFontUnderline();
  const initialTextAlign = editor?.getActiveTextAlign();
  const initialFontSize = editor?.getActiveFontSize() || FONT_SIZE;

  const [properties, setProperties] = useState({
    fillColor: initialFillColor,
    strokeColor: initialStrokeColor,
    fontFamily: initialFontFamily,
    fontWeight: initialFontWeight,
    fontStyle: initialFontStyle,
    fontLinethrough: initialFontLinethrough,
    fontUnderline: initialFontUnderline,
    textAlign: initialTextAlign,
    fontSize: initialFontSize,
  });

  const selectedObject = editor?.canvas?.getActiveObject();
  const isTextObject = selectedObject?.type === "textbox";

  const onChangeFontSize = (value: number) => {
    if (!selectedObject) {
      return;
    }

    editor?.changeFontSize(value);
    setProperties((current) => ({
      ...current,
      fontSize: value,
    }));
  };

  const onChangeTextAlign = (value: string) => {
    if (!selectedObject) {
      return;
    }

    editor?.changeTextAlign(value);
    setProperties((current) => ({
      ...current,
      textAlign: value,
    }));
  };

  const toggleBold = () => {
    if (!selectedObject) {
      return;
    }

    const newValue = properties.fontWeight > 500 ? 500 : 700;

    editor?.changeFontWeight(newValue);
    setProperties((current) => ({
      ...current,
      fontWeight: newValue,
    }));
  };

  const toggleItalic = () => {
    if (!selectedObject) {
      return;
    }

    const isItalic = properties.fontStyle === "italic";
    const newValue = isItalic ? "normal" : "italic";

    editor?.changeFontStyle(newValue);
    setProperties((current) => ({
      ...current,
      fontStyle: newValue,
    }));
  };

  const toggleLinethrough = () => {
    if (!selectedObject) {
      return;
    }

    const newValue = properties.fontLinethrough ? false : true;

    editor?.changeFontLinethrough(newValue);
    setProperties((current) => ({
      ...current,
      fontLinethrough: newValue,
    }));
  };

  const toggleUnderline = () => {
    if (!selectedObject) {
      return;
    }

    const newValue = properties.fontUnderline ? false : true;

    editor?.changeFontUnderline(newValue);
    setProperties((current) => ({
      ...current,
      fontUnderline: newValue,
    }));
  };

  const increment = () => {
    if (!selectedObject) return;
    const newSize = properties.fontSize + 5;
    onChangeFontSize(newSize);
  };

  const decrement = () => {
    if (!selectedObject) return;
    const newSize = Math.max(1, properties.fontSize - 5);
    onChangeFontSize(newSize);
  };

  const isSidebarActive =
    activeTool === "fill" ||
    activeTool === "strokeColor" ||
    activeTool === "font" ||
    activeTool === "strokeWidth";

  const isToolbarActive =
    activeTool === "shapes" ||
    activeTool === "text" ||
    activeTool === "images" ||
    activeTool === "draw" ||
    activeTool === "settings" ||
    activeTool === "ai" ||
    activeTool === "templates";

  return (
    <div
      className={`z-[15] flex h-[56px] w-full shrink-0 items-center gap-x-2 overflow-x-auto border-b bg-white p-2 transition-[padding] duration-300 ease-in-out ${
        isSidebarActive ? "pl-[272px]" : "pl-2"
      }`}
    >
      <div
        className={`z-[15] flex h-[56px] w-full shrink-0 items-center gap-x-2 overflow-x-auto border-b bg-white p-2 transition-[padding] duration-300 ease-in-out ${isToolbarActive ? "pl-[368px]" : "pl-2"}`}
      >
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
        {isTextObject && (
          <div className="flex h-full items-center justify-center">
            <Hint label="Font" side="bottom" sideOffset={5}>
              <Button
                onClick={() => onChangeActiveTool("font")}
                size="icon"
                variant="ghost"
                className={ny(
                  "w-auto px-2 text-sm",
                  activeTool === "font" && "bg-gray-100",
                )}
              >
                <div className="max-w-[100px] truncate">
                  {properties.fontFamily}
                </div>
                <ChevronDown className="ml-2 size-4 shrink-0" />
              </Button>
            </Hint>
          </div>
        )}
        {isTextObject && (
          <div className="flex h-full items-center justify-center">
            <Hint label="Bold" side="bottom" sideOffset={5}>
              <Button
                onClick={toggleBold}
                size="icon"
                variant="ghost"
                className={ny(properties.fontWeight > 500 && "bg-gray-100")}
              >
                <FaBold className="size-4" />
              </Button>
            </Hint>
          </div>
        )}
        {isTextObject && (
          <div className="flex h-full items-center justify-center">
            <Hint label="Italic" side="bottom" sideOffset={5}>
              <Button
                onClick={toggleItalic}
                size="icon"
                variant="ghost"
                className={ny(
                  properties.fontStyle === "italic" && "bg-gray-100",
                )}
              >
                <FaItalic className="size-4" />
              </Button>
            </Hint>
          </div>
        )}
        {isTextObject && (
          <div className="flex h-full items-center justify-center">
            <Hint label="Underline" side="bottom" sideOffset={5}>
              <Button
                onClick={toggleUnderline}
                size="icon"
                variant="ghost"
                className={ny(properties.fontUnderline && "bg-gray-100")}
              >
                <FaUnderline className="size-4" />
              </Button>
            </Hint>
          </div>
        )}
        {isTextObject && (
          <div className="flex h-full items-center justify-center">
            <Hint label="Strike" side="bottom" sideOffset={5}>
              <Button
                onClick={toggleLinethrough}
                size="icon"
                variant="ghost"
                className={ny(properties.fontLinethrough && "bg-gray-100")}
              >
                <FaStrikethrough className="size-4" />
              </Button>
            </Hint>
          </div>
        )}
        {isTextObject && (
          <div className="flex h-full items-center justify-center">
            <Hint label="Align left" side="bottom" sideOffset={5}>
              <Button
                onClick={() => onChangeTextAlign("left")}
                size="icon"
                variant="ghost"
                className={ny(properties.textAlign === "left" && "bg-gray-100")}
              >
                <AlignLeft className="size-4" />
              </Button>
            </Hint>
          </div>
        )}
        {isTextObject && (
          <div className="flex h-full items-center justify-center">
            <Hint label="Align center" side="bottom" sideOffset={5}>
              <Button
                onClick={() => onChangeTextAlign("center")}
                size="icon"
                variant="ghost"
                className={ny(
                  properties.textAlign === "center" && "bg-gray-100",
                )}
              >
                <AlignCenter className="size-4" />
              </Button>
            </Hint>
          </div>
        )}
        {isTextObject && (
          <div className="flex h-full items-center justify-center">
            <Hint label="Align right" side="bottom" sideOffset={5}>
              <Button
                onClick={() => onChangeTextAlign("right")}
                size="icon"
                variant="ghost"
                className={ny(
                  properties.textAlign === "right" && "bg-gray-100",
                )}
              >
                <AlignRight className="size-4" />
              </Button>
            </Hint>
          </div>
        )}
        {isTextObject && (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center">
              <Button
                onClick={decrement}
                variant="outline"
                className="rounded-r-none border-r-0 p-2"
                size="icon"
              >
                <Minus className="size-4" />
              </Button>
              <Input
                onChange={(e) => onChangeFontSize(Number(e.target.value))}
                value={properties.fontSize}
                className="w-[50px] rounded-none text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                style={{ fontSize: "14px" }}
              />
              <Button
                onClick={increment}
                variant="outline"
                className="rounded-l-none border-l-0 p-2"
                size="icon"
              >
                <Plus className="size-4" />
              </Button>
            </div>
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

        <div className="flex h-full items-center justify-between">
          <Hint label="Duplicate" side="bottom">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                editor?.onCopy();
                editor?.onPaste();
              }}
            >
              <Copy size={20} />
            </Button>
          </Hint>
        </div>

        <div className="flex h-full items-center justify-between">
          <Hint label="Delete" side="bottom">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => editor?.delete()}
            >
              <Trash size={20} />
            </Button>
          </Hint>
        </div>
      </div>
    </div>
  );
};
