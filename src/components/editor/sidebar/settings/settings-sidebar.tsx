import { ActiveTool } from "../../../../lib/types";
import { ToolSidebarHeader } from "../tool-sidebar/tool-sidebar-header";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { ScrollArea } from "~/components/ui/scroll-area";
import { SidebarBase } from "../tool-sidebar/sidebarBase";
import { useEffect, useMemo, useState } from "react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Settings, Monitor, Smartphone, Square, Palette } from "lucide-react";
import { motion } from "framer-motion";
import { ny } from "~/lib/utils";
import { ColorPalette } from "../draw/components/color-palette";

interface SettingsSidebarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  editor: any;
}

// preset canvas sizes
const presetSizes = [
  { name: "Instagram Post", width: 1080, height: 1080, icon: Square },
  { name: "Instagram Story", width: 1080, height: 1920, icon: Smartphone },
  { name: "Facebook Post", width: 1200, height: 630, icon: Monitor },
  { name: "Twitter Post", width: 1200, height: 675, icon: Monitor },
  { name: "YouTube Thumbnail", width: 1280, height: 720, icon: Monitor },
  { name: "Presentation", width: 1920, height: 1080, icon: Monitor },
];

export const SettingsSidebar = ({
  activeTool,
  onChangeActiveTool,
  editor,
}: SettingsSidebarProps) => {
  const onClose = () => {
    onChangeActiveTool("select");
  };

  const workspace = editor?.getWorkspace();

  const initialWidth = useMemo(() => `${workspace?.width ?? 0}`, [workspace]);
  const initialHeight = useMemo(() => `${workspace?.height ?? 0}`, [workspace]);
  const initialBackground = useMemo(
    () => workspace?.fill ?? "#ffffff",
    [workspace],
  );

  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [background, setBackground] = useState(initialBackground);

  useEffect(() => {
    setWidth(initialWidth);
    setHeight(initialHeight);
    setBackground(initialBackground);
  }, [initialWidth, initialHeight, initialBackground]);

  const changeWidth = (value: string) => setWidth(value);
  const changeHeight = (value: string) => setHeight(value);
  const changeBackground = (value: string) => {
    setBackground(value);
    editor?.changeBackground(value);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    editor?.changeSize({
      width: parseInt(width, 10),
      height: parseInt(height, 10),
    });
  };

  const applyPreset = (preset: (typeof presetSizes)[0]) => {
    setWidth(String(preset.width));
    setHeight(String(preset.height));
    editor?.changeSize({
      width: preset.width,
      height: preset.height,
    });
  };

  return (
    <SidebarBase isVisible={activeTool === "settings"} onClose={onClose}>
      <ToolSidebarHeader
        title="Settings"
        description="configure canvas settings"
        icon={Settings}
      />

      <ScrollArea className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6 p-4"
        >
          {/* canvas size section */}
          <div className="space-y-3">
            <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Canvas Size
            </span>

            <form onSubmit={onSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-muted-foreground text-xs font-medium">
                    Width
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Width"
                      value={width}
                      type="number"
                      onChange={(e) => changeWidth(e.target.value)}
                      className="bg-muted/30 border-border h-10 rounded-lg pr-8 text-sm"
                    />
                    <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                      px
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-muted-foreground text-xs font-medium">
                    Height
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Height"
                      value={height}
                      type="number"
                      onChange={(e) => changeHeight(e.target.value)}
                      className="bg-muted/30 border-border h-10 rounded-lg pr-8 text-sm"
                    />
                    <span className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                      px
                    </span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="h-10 w-full rounded-lg font-medium"
              >
                Apply Size
              </Button>
            </form>
          </div>

          {/* divider */}
          <div className="bg-border h-px" />

          {/* preset sizes */}
          <div className="space-y-3">
            <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Preset Sizes
            </span>

            <div className="grid grid-cols-2 gap-2">
              {presetSizes.map((preset) => {
                const isSelected =
                  width === String(preset.width) &&
                  height === String(preset.height);
                const Icon = preset.icon;

                return (
                  <motion.button
                    key={preset.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => applyPreset(preset)}
                    className={ny(
                      "group flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/50 hover:shadow-sm",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={ny(
                          "flex size-7 items-center justify-center rounded-lg transition-colors",
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                        )}
                      >
                        <Icon className="size-3.5" />
                      </div>
                    </div>
                    <div>
                      <p
                        className={ny(
                          "text-xs font-medium",
                          isSelected ? "text-primary" : "text-foreground",
                        )}
                      >
                        {preset.name}
                      </p>
                      <p className="text-muted-foreground text-[10px]">
                        {preset.width} × {preset.height}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* divider */}
          <div className="bg-border h-px" />

          {/* background color */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="text-muted-foreground size-4" />
              <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Background Color
              </span>
            </div>

            <ColorPalette
              value={background as string}
              onChange={changeBackground}
              canvas={editor?.canvas}
            />
          </div>
        </motion.div>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />
    </SidebarBase>
  );
};
