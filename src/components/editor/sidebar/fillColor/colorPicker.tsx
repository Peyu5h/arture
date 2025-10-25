import { ChromePicker, CirclePicker } from "react-color";
import { rgbaObjectToString } from "~/lib/utils";
import { colors, FONT_FAMILY } from "../../../../lib/types";
import { Button } from "~/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Canvas } from "fabric/fabric-impl";
import { useDocumentColors } from "~/hooks/useDocumentColors";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FaEyeDropper } from "react-icons/fa6";
import { Card } from "~/components/ui/card";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  canvas: Canvas | null | undefined;
}

export const ColorPicker = ({ value, onChange, canvas }: ColorPickerProps) => {
  const documentColors = useDocumentColors(canvas);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const customStyles = {
    default: {
      card: {
        width: "100%",
        maxWidth: "320px",
        borderRadius: "8px",
        hover: {
          scale: 1.01,
        },
      },
      circle: {
        borderRadius: "8px",
        width: "44px",
        height: "44px",
        margin: "2px",
      },
    },
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setIsColorPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleColorChange = (color: any) => {
    const formattedValue = color.hex || rgbaObjectToString(color.rgb);
    onChange(formattedValue);
  };

  const handleEyeDropper = async () => {
    try {
      // @ts-ignore
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      onChange(result.sRGBHex);
    } catch (e) {
      console.log("Browser does not support the EyeDropper API");
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex w-full justify-between gap-4">
        <Button
          variant="outline"
          size="icon"
          className="w-full"
          onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
        >
          <Plus className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="w-full"
          onClick={handleEyeDropper}
        >
          <FaEyeDropper className="size-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Document Colors</h3>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {documentColors.map(({ color }) => (
            <div
              key={color}
              className="max-w-auto border-border size-12 cursor-pointer rounded-lg border transition-transform hover:scale-105"
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Default Colors</h3>
        <div className="w-full max-w-full overflow-hidden p-1">
          <CirclePicker
            color={value}
            colors={colors}
            circleSize={44}
            width="320px"
            styles={customStyles}
            onChangeComplete={handleColorChange}
          />
        </div>
      </div>

      <AnimatePresence>
        {isColorPickerOpen && (
          <motion.div
            ref={colorPickerRef}
            initial={{ opacity: 1, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 1, y: -5 }}
            transition={{ duration: 0.1 }}
            className="absolute top-8 left-0 z-50"
          >
            <Card className="p-2">
              <ChromePicker
                color={value}
                onChange={handleColorChange}
                className="!shadow-none"
              />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
