import { ChromePicker, CirclePicker } from "react-color";
import { rgbaObjectToString } from "~/lib/utils";
import { Input } from "~/components/input";
import * as material from "material-colors";

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

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export const BorderColorPicker = ({ value, onChange }: ColorPickerProps) => {
  const handleColorChange = (color: any) => {
    const formattedValue = color.hex || rgbaObjectToString(color.rgb);
    onChange(formattedValue);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue.match(/^#[0-9A-Fa-f]{0,6}$/)) {
      if (newValue.length === 7) {
        // Complete hex color
        onChange(newValue);
      }
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-3 rounded-md border bg-gray-50/50 p-3">
        <div
          className="size-8 rounded-md border shadow-sm"
          style={{ backgroundColor: value }}
        />
        <Input
          value={value}
          onChange={handleHexInputChange}
          className="h-8 font-mono"
          placeholder="#000000"
        />
      </div>

      <div className="rounded-lg border bg-white p-4">
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
