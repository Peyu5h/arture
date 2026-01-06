import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { SidebarBase } from "../tool-sidebar/sidebarBase";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { ActiveTool } from "~/lib/types";
import { LayerPanel } from "../layers/layer-panel";
import { useInfinitePexelsSearch } from "~/hooks/usePexels";
import { useDebounce } from "use-debounce";
import {
  Search,
  X,
  Monitor,
  Smartphone,
  FileText,
  ChevronRight,
  ChevronLeft,
  ImageIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { ny } from "~/lib/utils";

interface TemplatesSidebarProps {
  editor: any;
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

const presetCategories = [
  {
    name: "Social Media",
    presets: [
      { name: "Instagram Post", width: 1080, height: 1080, icon: Monitor },
      { name: "Instagram Story", width: 1080, height: 1920, icon: Smartphone },
      { name: "Facebook Post", width: 1200, height: 630, icon: Monitor },
      { name: "Facebook Cover", width: 820, height: 312, icon: Monitor },
      { name: "Twitter Post", width: 1200, height: 675, icon: Monitor },
      { name: "LinkedIn Post", width: 1200, height: 627, icon: Monitor },
      { name: "YouTube Thumbnail", width: 1280, height: 720, icon: Monitor },
    ],
  },
  {
    name: "Print",
    presets: [
      { name: "A4 Portrait", width: 2480, height: 3508, icon: FileText },
      { name: "A4 Landscape", width: 3508, height: 2480, icon: FileText },
      { name: "Letter", width: 2550, height: 3300, icon: FileText },
      { name: "Business Card", width: 1050, height: 600, icon: FileText },
    ],
  },
  {
    name: "Presentation",
    presets: [
      { name: "16:9 Widescreen", width: 1920, height: 1080, icon: Monitor },
      { name: "4:3 Standard", width: 1024, height: 768, icon: Monitor },
      { name: "Mobile", width: 1080, height: 1920, icon: Smartphone },
    ],
  },
];

// gradients without names
const backgroundGradients = [
  {
    id: "g1",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    colors: ["#667eea", "#764ba2"],
  },
  {
    id: "g2",
    gradient: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",
    colors: ["#2193b0", "#6dd5ed"],
  },
  {
    id: "g3",
    gradient: "linear-gradient(135deg, #f12711 0%, #f5af19 100%)",
    colors: ["#f12711", "#f5af19"],
  },
  {
    id: "g4",
    gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    colors: ["#11998e", "#38ef7d"],
  },
  {
    id: "g5",
    gradient: "linear-gradient(135deg, #232526 0%, #414345 100%)",
    colors: ["#232526", "#414345"],
  },
  {
    id: "g6",
    gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    colors: ["#ffecd2", "#fcb69f"],
  },
  {
    id: "g7",
    gradient: "linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)",
    colors: ["#00d2ff", "#3a7bd5"],
  },
  {
    id: "g8",
    gradient: "linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)",
    colors: ["#ee9ca7", "#ffdde1"],
  },
  {
    id: "g9",
    gradient: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    colors: ["#0f0c29", "#24243e"],
  },
  {
    id: "g10",
    gradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    colors: ["#ff9a9e", "#fecfef"],
  },
  {
    id: "g11",
    gradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    colors: ["#a18cd1", "#fbc2eb"],
  },
  {
    id: "g12",
    gradient: "linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)",
    colors: ["#fad0c4", "#ffd1ff"],
  },
  {
    id: "g13",
    gradient:
      "linear-gradient(135deg, #ff8177 0%, #ff867a 21%, #ff8c7f 52%, #f99185 78%, #cf556c 100%)",
    colors: ["#ff8177", "#cf556c"],
  },
  {
    id: "g14",
    gradient: "linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)",
    colors: ["#5ee7df", "#b490ca"],
  },
  {
    id: "g15",
    gradient: "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)",
    colors: ["#d299c2", "#fef9d7"],
  },
  {
    id: "g16",
    gradient: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
    colors: ["#89f7fe", "#66a6ff"],
  },
  {
    id: "g17",
    gradient: "linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)",
    colors: ["#fddb92", "#d1fdff"],
  },
  {
    id: "g18",
    gradient: "linear-gradient(135deg, #9890e3 0%, #b1f4cf 100%)",
    colors: ["#9890e3", "#b1f4cf"],
  },
  {
    id: "g19",
    gradient: "linear-gradient(135deg, #ebc0fd 0%, #d9ded8 100%)",
    colors: ["#ebc0fd", "#d9ded8"],
  },
  {
    id: "g20",
    gradient: "linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)",
    colors: ["#96fbc4", "#f9f586"],
  },
  {
    id: "g21",
    gradient: "linear-gradient(135deg, #2af598 0%, #009efd 100%)",
    colors: ["#2af598", "#009efd"],
  },
  {
    id: "g22",
    gradient: "linear-gradient(135deg, #cd9cf2 0%, #f6f3ff 100%)",
    colors: ["#cd9cf2", "#f6f3ff"],
  },
  {
    id: "g23",
    gradient: "linear-gradient(135deg, #e8198b 0%, #c7eafd 100%)",
    colors: ["#e8198b", "#c7eafd"],
  },
  {
    id: "g24",
    gradient: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    colors: ["#f5f7fa", "#c3cfe2"],
  },
  {
    id: "g25",
    gradient: "linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)",
    colors: ["#fdfcfb", "#e2d1c3"],
  },
  {
    id: "g26",
    gradient: "linear-gradient(135deg, #0c3483 0%, #a2b6df 50%, #6b8cce 100%)",
    colors: ["#0c3483", "#6b8cce"],
  },
  {
    id: "g27",
    gradient: "linear-gradient(135deg, #00c6fb 0%, #005bea 100%)",
    colors: ["#00c6fb", "#005bea"],
  },
  {
    id: "g28",
    gradient: "linear-gradient(135deg, #74ebd5 0%, #9face6 100%)",
    colors: ["#74ebd5", "#9face6"],
  },
  {
    id: "g29",
    gradient: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
    colors: ["#6a11cb", "#2575fc"],
  },
  {
    id: "g30",
    gradient: "linear-gradient(135deg, #37ecba 0%, #72afd3 100%)",
    colors: ["#37ecba", "#72afd3"],
  },
];

const solidColors = [
  { id: "white", color: "#ffffff" },
  { id: "black", color: "#000000" },
  { id: "gray", color: "#6b7280" },
  { id: "slate", color: "#475569" },
  { id: "red", color: "#ef4444" },
  { id: "rose", color: "#f43f5e" },
  { id: "orange", color: "#f97316" },
  { id: "amber", color: "#f59e0b" },
  { id: "yellow", color: "#eab308" },
  { id: "lime", color: "#84cc16" },
  { id: "green", color: "#22c55e" },
  { id: "emerald", color: "#10b981" },
  { id: "teal", color: "#14b8a6" },
  { id: "cyan", color: "#06b6d4" },
  { id: "sky", color: "#0ea5e9" },
  { id: "blue", color: "#3b82f6" },
  { id: "indigo", color: "#6366f1" },
  { id: "violet", color: "#8b5cf6" },
  { id: "purple", color: "#a855f7" },
  { id: "fuchsia", color: "#d946ef" },
  { id: "pink", color: "#ec4899" },
];

interface BackgroundImageCardProps {
  url: string;
  thumbnail: string;
  alt?: string;
  onClick: () => void;
}

const BackgroundImageCard = ({
  thumbnail,
  alt,
  onClick,
}: BackgroundImageCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={ny(
        "relative aspect-video cursor-pointer overflow-hidden rounded-lg border transition-all",
        "border-border bg-muted/30 hover:border-primary/50 hover:shadow-md",
      )}
    >
      {!isLoaded && !hasError && (
        <div className="bg-muted absolute inset-0 animate-pulse" />
      )}
      {hasError ? (
        <div className="bg-muted/50 flex size-full items-center justify-center">
          <span className="text-muted-foreground text-xs">Error</span>
        </div>
      ) : (
        <img
          src={thumbnail}
          alt={alt || "Background"}
          className={ny(
            "size-full object-cover transition-all duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          draggable={false}
        />
      )}
    </motion.button>
  );
};

export const TemplatesSidebar = ({
  editor,
  activeTool,
  onChangeActiveTool,
}: TemplatesSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<
    "main" | "resize" | "background"
  >("main");
  const [bgSearchQuery, setBgSearchQuery] = useState("");
  const [debouncedBgSearch] = useDebounce(bgSearchQuery, 300);
  const [selectedBgType, setSelectedBgType] = useState<
    "solid" | "gradient" | "image"
  >("gradient");

  const workspace = editor?.getWorkspace?.();
  const initialWidth = workspace?.width || 1200;
  const initialHeight = workspace?.height || 900;
  const initialBackground =
    typeof workspace?.fill === "string" ? workspace.fill : "#ffffff";

  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [background, setBackground] = useState(initialBackground);
  const [selectedGradient, setSelectedGradient] = useState<string | null>(null);

  // background images from pexels
  const { data: bgImagesData, isLoading: isLoadingBgImages } =
    useInfinitePexelsSearch(debouncedBgSearch || "background texture");

  const backgroundImages =
    bgImagesData?.pages.flatMap((page) =>
      page.images.map((img: any) => ({
        id: img.id,
        url: img.url,
        thumbnail: img.thumbnail || img.preview,
        alt: img.alt,
      })),
    ) || [];

  const isRateLimited = bgImagesData?.pages[0]?.rateLimited || false;
  const noApiKey = bgImagesData?.pages[0]?.noApiKey || false;

  useEffect(() => {
    if (workspace) {
      setWidth(workspace.width || 1200);
      setHeight(workspace.height || 900);
      const fill = workspace.fill;
      if (typeof fill === "string") {
        setBackground(fill);
        setSelectedGradient(null);
      }
    }
  }, [workspace]);

  const onClose = () => {
    onChangeActiveTool("select");
  };

  const applySize = () => {
    editor?.changeSize({ width, height });
  };

  const applyPreset = (preset: { width: number; height: number }) => {
    setWidth(preset.width);
    setHeight(preset.height);
    editor?.changeSize({ width: preset.width, height: preset.height });
  };

  const applyGradientBackground = useCallback(
    (gradientId: string, colors: string[]) => {
      if (!editor?.canvas) return;
      const workspace = editor.getWorkspace?.();
      if (!workspace) return;

      const fabricGradient = new (window as any).fabric.Gradient({
        type: "linear",
        gradientUnits: "percentage",
        coords: { x1: 0, y1: 0, x2: 1, y2: 1 },
        colorStops: [
          { offset: 0, color: colors[0] },
          { offset: 1, color: colors[1] },
        ],
      });

      workspace.set({ fill: fabricGradient });
      editor.canvas.requestRenderAll();
      editor.save?.();
      setSelectedGradient(gradientId);
      setBackground("");
    },
    [editor],
  );

  const applySolidBackground = useCallback(
    (color: string) => {
      editor?.changeBackground?.(color);
      setBackground(color);
      setSelectedGradient(null);
    },
    [editor],
  );

  const applyImageBackground = useCallback(
    (imageUrl: string) => {
      if (!editor?.canvas) return;
      const workspace = editor.getWorkspace?.();
      if (!workspace) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const pattern = new (window as any).fabric.Pattern({
          source: img,
          repeat: "no-repeat",
        });

        const scaleX = (workspace.width || 1) / img.width;
        const scaleY = (workspace.height || 1) / img.height;
        const scale = Math.max(scaleX, scaleY);

        pattern.patternTransform = [scale, 0, 0, scale, 0, 0];

        workspace.set({ fill: pattern });
        editor.canvas.requestRenderAll();
        editor.save?.();
        setSelectedGradient(null);
        setBackground("");
      };
      img.src = imageUrl;
    },
    [editor],
  );

  // resize section view
  if (activeSection === "resize") {
    return (
      <SidebarBase isVisible={activeTool === "templates"} onClose={onClose}>
        <div className="border-border flex items-center gap-3 border-b px-4 py-3">
          <button
            onClick={() => setActiveSection("main")}
            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-1.5 transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          <h2 className="text-base font-semibold">Resize Canvas</h2>
        </div>

        <ScrollArea className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 p-4"
          >
            <div className="space-y-4">
              <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Custom Size
              </h3>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-muted-foreground mb-1 block text-xs">
                    Width
                  </label>
                  <Input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="h-10"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-muted-foreground mb-1 block text-xs">
                    Height
                  </label>
                  <Input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="h-10"
                  />
                </div>
              </div>
              <Button onClick={applySize} className="w-full">
                Apply Size
              </Button>
            </div>

            <div className="bg-border h-px" />

            {presetCategories.map((category) => (
              <div key={category.name} className="space-y-3">
                <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                  {category.name}
                </h3>
                <div className="space-y-2">
                  {category.presets.map((preset) => {
                    const Icon = preset.icon;
                    const isSelected =
                      width === preset.width && height === preset.height;
                    return (
                      <motion.button
                        key={preset.name}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => applyPreset(preset)}
                        className={ny(
                          "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30 hover:bg-muted/50",
                        )}
                      >
                        <div
                          className={ny(
                            "flex size-9 items-center justify-center rounded-lg",
                            isSelected
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Icon className="size-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{preset.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {preset.width} × {preset.height}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        </ScrollArea>

        <ToolSidebarClose onClick={onClose} />
      </SidebarBase>
    );
  }

  // background section view
  if (activeSection === "background") {
    return (
      <SidebarBase isVisible={activeTool === "templates"} onClose={onClose}>
        <div className="border-border flex items-center gap-3 border-b px-4 py-3">
          <button
            onClick={() => setActiveSection("main")}
            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-1.5 transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          <h2 className="text-base font-semibold">Background</h2>
        </div>

        <div className="border-border flex gap-1 border-b p-2">
          {(["solid", "gradient", "image"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedBgType(type)}
              className={ny(
                "flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-all",
                selectedBgType === type
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {type}
            </button>
          ))}
        </div>

        <ScrollArea className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4"
          >
            {selectedBgType === "solid" && (
              <div className="grid grid-cols-5 gap-2">
                {solidColors.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => applySolidBackground(item.color)}
                    className={ny(
                      "aspect-square rounded-lg border-2 transition-all",
                      background === item.color
                        ? "border-primary ring-primary/20 ring-2"
                        : "border-border hover:border-primary/50",
                    )}
                    style={{ backgroundColor: item.color }}
                    title={item.id}
                  />
                ))}
              </div>
            )}

            {selectedBgType === "gradient" && (
              <div className="grid grid-cols-3 gap-2">
                {backgroundGradients.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() =>
                      applyGradientBackground(item.id, item.colors)
                    }
                    className={ny(
                      "aspect-[4/3] rounded-lg border-2 transition-all",
                      selectedGradient === item.id
                        ? "border-primary ring-primary/20 ring-2"
                        : "border-border hover:border-primary/50",
                    )}
                    style={{ background: item.gradient }}
                  />
                ))}
              </div>
            )}

            {selectedBgType === "image" && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    placeholder="Search backgrounds..."
                    value={bgSearchQuery}
                    onChange={(e) => setBgSearchQuery(e.target.value)}
                    className="bg-muted/50 border-0 pl-9"
                  />
                  {bgSearchQuery && (
                    <button
                      onClick={() => setBgSearchQuery("")}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>

                {isRateLimited && (
                  <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg p-3 text-sm">
                    <AlertCircle className="size-4" />
                    <span>Rate limit exceeded. Try again later.</span>
                  </div>
                )}

                {noApiKey && (
                  <div className="bg-muted text-muted-foreground flex items-center gap-2 rounded-lg p-3 text-sm">
                    <AlertCircle className="size-4" />
                    <span>Pexels API not configured.</span>
                  </div>
                )}

                {isLoadingBgImages && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="text-muted-foreground size-6 animate-spin" />
                  </div>
                )}

                {!isLoadingBgImages &&
                  backgroundImages.length === 0 &&
                  !isRateLimited &&
                  !noApiKey && (
                    <div className="text-muted-foreground py-8 text-center text-sm">
                      No images found. Try a different search.
                    </div>
                  )}

                <div className="grid grid-cols-2 gap-2">
                  {backgroundImages.map((img) => (
                    <BackgroundImageCard
                      key={img.id}
                      url={img.url}
                      thumbnail={img.thumbnail}
                      alt={img.alt}
                      onClick={() => applyImageBackground(img.url)}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </ScrollArea>

        <ToolSidebarClose onClick={onClose} />
      </SidebarBase>
    );
  }

  // main view
  return (
    <SidebarBase isVisible={activeTool === "templates"} onClose={onClose}>
      <div className="border-border flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-base font-semibold">Design</h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg p-1.5 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4 p-4"
        >
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveSection("resize")}
            className="border-border hover:border-primary/30 hover:bg-muted/50 flex w-full items-center justify-between rounded-lg border p-4 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
                <Monitor className="text-primary size-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Resize Canvas</p>
                <p className="text-muted-foreground text-xs">
                  {width} × {height} px
                </p>
              </div>
            </div>
            <ChevronRight className="text-muted-foreground size-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setActiveSection("background")}
            className="border-border hover:border-primary/30 hover:bg-muted/50 flex w-full items-center justify-between rounded-lg border p-4 transition-all"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex size-10 items-center justify-center rounded-lg border"
                style={{
                  background: selectedGradient
                    ? backgroundGradients.find((g) => g.id === selectedGradient)
                        ?.gradient
                    : background || "#ffffff",
                }}
              >
                <ImageIcon
                  className={ny(
                    "size-5",
                    background === "#ffffff" || background === "#fff"
                      ? "text-gray-400"
                      : "text-white/80",
                  )}
                />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Background</p>
                <p className="text-muted-foreground text-xs">
                  {selectedGradient
                    ? "Gradient"
                    : background
                      ? "Solid"
                      : "Default"}
                </p>
              </div>
            </div>
            <ChevronRight className="text-muted-foreground size-4" />
          </motion.button>

          {/* layer panel */}
          <div className="pt-2">
            <LayerPanel editor={editor} />
          </div>
        </motion.div>
      </ScrollArea>

      <ToolSidebarClose onClick={onClose} />
    </SidebarBase>
  );
};
