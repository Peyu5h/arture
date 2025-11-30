import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Pipette } from "lucide-react";
import { Canvas } from "fabric/fabric-impl";
import { useDocumentColors } from "~/hooks/useDocumentColors";
import { ny } from "~/lib/utils";
import { colors } from "~/lib/types";

interface ColorPaletteProps {
  value: string;
  onChange: (value: string) => void;
  canvas: Canvas | null | undefined;
}

// hex to rgb conversion
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// determines if color is light
const isLightColor = (color: string): boolean => {
  if (color === "transparent") return true;
  const rgb = hexToRgb(color);
  if (!rgb) return false;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.6;
};

interface ColorSwatchProps {
  color: string;
  isSelected: boolean;
  onClick: () => void;
  size?: "sm" | "md";
}

const ColorSwatch = ({
  color,
  isSelected,
  onClick,
  size = "md",
}: ColorSwatchProps) => {
  const isTransparent = color === "transparent";
  const isLight = isLightColor(color);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className={ny(
        "focus-visible:ring-primary relative rounded-lg transition-shadow focus:outline-none focus-visible:ring-2",
        size === "sm" ? "size-8" : "size-10",
        isSelected &&
          "ring-primary ring-offset-background ring-2 ring-offset-2",
      )}
      style={{
        backgroundColor: isTransparent ? "transparent" : color,
      }}
    >
      {isTransparent && (
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-0.5 w-full rotate-45 bg-red-500" />
          </div>
        </div>
      )}
      {isSelected && !isTransparent && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Check
            className={ny("size-4", isLight ? "text-gray-800" : "text-white")}
            strokeWidth={3}
          />
        </motion.div>
      )}
    </motion.button>
  );
};

export const ColorPalette = ({
  value,
  onChange,
  canvas,
}: ColorPaletteProps) => {
  const documentColors = useDocumentColors(canvas);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customColor, setCustomColor] = useState(value);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setShowCustomPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEyeDropper = async () => {
    try {
      // @ts-ignore
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      onChange(result.sRGBHex);
      setCustomColor(result.sRGBHex);
    } catch (e) {
      console.log("eyedropper not supported");
    }
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

  // curated color palette
  const curatedColors = colors.filter((c) => c !== "transparent");

  return (
    <div className="space-y-5 select-none">
      {/* current color & tools */}
      <div className="space-y-3">
        <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Current Color
        </span>
        <div className="flex items-center gap-3">
          {/* current color preview */}
          <div
            className="border-border size-12 rounded-xl border shadow-sm"
            style={{
              backgroundColor: value === "transparent" ? "transparent" : value,
              backgroundImage:
                value === "transparent"
                  ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                  : "none",
              backgroundSize: "10px 10px",
              backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
            }}
          />

          {/* color code input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="bg-muted/50 border-border focus:ring-primary h-10 w-full rounded-lg border px-3 font-mono text-sm uppercase focus:ring-2 focus:outline-none"
              placeholder="#000000"
            />
          </div>

          {/* tools */}
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                setShowCustomPicker(!showCustomPicker);
                setTimeout(() => inputRef.current?.click(), 100);
              }}
              className="bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted flex size-10 items-center justify-center rounded-lg border transition-colors"
            >
              <Plus className="size-4" />
            </button>
            <button
              onClick={handleEyeDropper}
              className="bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted flex size-10 items-center justify-center rounded-lg border transition-colors"
            >
              <Pipette className="size-4" />
            </button>
          </div>

          {/* hidden native color input */}
          <input
            ref={inputRef}
            type="color"
            value={customColor}
            onChange={handleCustomColorChange}
            className="sr-only"
          />
        </div>
      </div>

      {/* document colors */}
      {documentColors.length > 0 && (
        <div className="space-y-3">
          <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            Document Colors
          </span>
          <div className="flex flex-wrap gap-2">
            {documentColors.map(({ color }) => (
              <ColorSwatch
                key={color}
                color={color}
                isSelected={value === color}
                onClick={() => onChange(color)}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}

      {/* color palette */}
      <div className="space-y-3">
        <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Color Palette
        </span>
        <div className="grid grid-cols-6 gap-2">
          {curatedColors.map((color) => (
            <ColorSwatch
              key={color}
              color={color}
              isSelected={value === color}
              onClick={() => onChange(color)}
            />
          ))}
          <ColorSwatch
            color="transparent"
            isSelected={value === "transparent"}
            onClick={() => onChange("transparent")}
          />
        </div>
      </div>

      {/* quick actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onChange("#000000")}
          className={ny(
            "flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-medium transition-all",
            value === "#000000"
              ? "bg-foreground text-background border-foreground"
              : "bg-muted/30 text-muted-foreground border-border hover:bg-muted hover:text-foreground",
          )}
        >
          <span className="border-border size-3 rounded-full border bg-black" />
          Black
        </button>
        <button
          onClick={() => onChange("#ffffff")}
          className={ny(
            "flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-medium transition-all",
            value === "#ffffff"
              ? "bg-foreground text-background border-foreground"
              : "bg-muted/30 text-muted-foreground border-border hover:bg-muted hover:text-foreground",
          )}
        >
          <span className="border-border size-3 rounded-full border bg-white" />
          White
        </button>
      </div>
    </div>
  );
};
