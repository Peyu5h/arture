import { ChromePicker, CirclePicker, ColorResult } from "react-color";
import { rgbaObjectToString } from "~/lib/utils";
import { Input } from "~/components/ui/input";
import * as material from "material-colors";
import { useState, useEffect } from "react";

const extendedColors = [
  "#000000",
  "#424242",
  "#757575",
  "#BDBDBD",
  "#FFFFFF",
  material.red["500"],
  material.red["700"],
  material.blue["500"],
  material.blue["700"],
  material.green["500"],
  material.green["700"],
  material.purple["500"],
  material.purple["700"],
  material.orange["500"],
  material.orange["700"],
  material.cyan["500"],
  material.cyan["700"],
  material.pink["500"],
  material.teal["500"],
  material.indigo["500"],
  material.amber["500"],
  "transparent",
];

interface BorderColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export const BorderColorPicker = ({
  value,
  onChange,
}: BorderColorPickerProps) => {
  const [inputValue, setInputValue] = useState(value);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handleColorChange = (color: ColorResult) => {
    const newValue = color.hex;
    setInputValue(newValue);
    onChange(newValue);
  };

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <div className="w-full space-y-4">
      <div className="bg-muted/50 flex items-center gap-3 rounded-md border p-3">
        <div
          className="size-8 rounded-md border shadow-sm"
          style={{ backgroundColor: value }}
        />
        <Input
          value={inputValue}
          onChange={handleInputChange}
          className="h-8 font-mono"
          placeholder="#000000"
        />
      </div>

      <div className="bg-card rounded-lg border p-4">
        <CirclePicker
          color={value}
          colors={extendedColors}
          onChangeComplete={handleColorChange}
          width="100%"
          circleSize={24}
          circleSpacing={12}
        />
      </div>
    </div>
  );
};
