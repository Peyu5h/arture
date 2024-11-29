import { ChromePicker, CirclePicker } from "react-color";
import { rgbaObjectToString } from "~/lib/utils";
import { colors } from "../../types";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export const ColorPicker = ({ value, onChange }: ColorPickerProps) => {
  const handleColorChange = (color: any) => {
    const formattedValue = color.hex || rgbaObjectToString(color.rgb);
    onChange(formattedValue);
  };

  return (
    <div className="w-full space-y-4">
      <ChromePicker
        color={value}
        onChange={handleColorChange}
        className="rounded-lg border"
      />
      <CirclePicker
        color={value}
        colors={colors}
        onChangeComplete={handleColorChange}
      />
    </div>
  );
};
