import { useState } from "react";
import { Input } from "~/components/ui/input";
import { Slider } from "~/components/ui/slider";

interface StrokeWidthControlProps {
  value: number;
  onChange: (value: number) => void;
  strokeType?: "solid" | "dashed";
  onStrokeTypeChange?: (type: "solid" | "dashed") => void;
}

export const StrokeWidthControl = ({
  value,
  onChange,
  strokeType = "solid",
  onStrokeTypeChange,
}: StrokeWidthControlProps) => {
  const [inputValue, setInputValue] = useState(value.toString());

  const handleSliderChange = (newValue: number[]) => {
    const value = newValue[0];
    setInputValue(value.toString());
    onChange(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    const numValue = parseInt(newValue);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      onChange(numValue);
    }
  };

  const handleStrokeTypeChange = (type: "solid" | "dashed") => {
    onStrokeTypeChange?.(type);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Width</span>
          <div className="w-20">
            <Input
              type="number"
              min={0}
              max={100}
              value={inputValue}
              onChange={handleInputChange}
              className="h-8 text-center"
            />
          </div>
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[value]}
          onValueChange={handleSliderChange}
          className="py-2"
        />
      </div>

      <div className="space-y-3">
        <span className="text-foreground text-sm font-medium">Style</span>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleStrokeTypeChange("solid")}
            className={`hover:bg-accent/50 flex h-10 items-center justify-center rounded-md border transition-all ${
              strokeType === "solid"
                ? "border-primary bg-accent/50"
                : "border-border"
            }`}
          >
            <div className="bg-foreground h-0.5 w-16" />
          </button>
          <button
            onClick={() => handleStrokeTypeChange("dashed")}
            className={`hover:bg-accent/50 flex h-10 items-center justify-center rounded-md border transition-all ${
              strokeType === "dashed"
                ? "border-primary bg-accent/50"
                : "border-border"
            }`}
          >
            <div className="h-0.5 w-16 border-t-2 border-dashed border-black" />
          </button>
        </div>
      </div>
    </div>
  );
};
