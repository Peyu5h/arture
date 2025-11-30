import { ActiveTool } from "../../../../lib/types";
import { ToolSidebarHeader } from "../tool-sidebar/tool-sidebar-header";
import { ToolSidebarClose } from "../tool-sidebar/tool-sidebar-close";
import { ScrollArea } from "~/components/ui/scroll-area";
import { SidebarBase } from "../tool-sidebar/sidebarBase";
import { Layers3, Search, Sparkles, Palette } from "lucide-react";
import { motion } from "framer-motion";
import { ny } from "~/lib/utils";
import { Input } from "~/components/ui/input";
import { useState } from "react";

interface DesignSidebarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
  editor: any;
}

// background gradients
const backgroundGradients = [
  {
    id: "gradient-1",
    name: "Purple Haze",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    colors: ["#667eea", "#764ba2"],
  },
  {
    id: "gradient-2",
    name: "Pink Sunset",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    colors: ["#f093fb", "#f5576c"],
  },
  {
    id: "gradient-3",
    name: "Ocean Blue",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    colors: ["#4facfe", "#00f2fe"],
  },
  {
    id: "gradient-4",
    name: "Fresh Mint",
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    colors: ["#43e97b", "#38f9d7"],
  },
  {
    id: "gradient-5",
    name: "Warm Flame",
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    colors: ["#fa709a", "#fee140"],
  },
  {
    id: "gradient-6",
    name: "Soft Peach",
    gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    colors: ["#a8edea", "#fed6e3"],
  },
  {
    id: "gradient-7",
    name: "Lavender Dream",
    gradient: "linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)",
    colors: ["#5ee7df", "#b490ca"],
  },
  {
    id: "gradient-8",
    name: "Cream Rose",
    gradient: "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)",
    colors: ["#d299c2", "#fef9d7"],
  },
  {
    id: "gradient-9",
    name: "Deep Space",
    gradient: "linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)",
    colors: ["#0c0c0c", "#1a1a2e", "#16213e"],
  },
  {
    id: "gradient-10",
    name: "Sunrise",
    gradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)",
    colors: ["#ff9a9e", "#fecfef"],
  },
  {
    id: "gradient-11",
    name: "Royal Blue",
    gradient: "linear-gradient(135deg, #536976 0%, #292E49 100%)",
    colors: ["#536976", "#292E49"],
  },
  {
    id: "gradient-12",
    name: "Citrus",
    gradient: "linear-gradient(135deg, #f5af19 0%, #f12711 100%)",
    colors: ["#f5af19", "#f12711"],
  },
];

// solid colors
const solidColors = [
  { id: "white", name: "White", color: "#ffffff" },
  { id: "black", name: "Black", color: "#000000" },
  { id: "gray", name: "Gray", color: "#6b7280" },
  { id: "red", name: "Red", color: "#ef4444" },
  { id: "orange", name: "Orange", color: "#f97316" },
  { id: "yellow", name: "Yellow", color: "#eab308" },
  { id: "green", name: "Green", color: "#22c55e" },
  { id: "blue", name: "Blue", color: "#3b82f6" },
  { id: "purple", name: "Purple", color: "#a855f7" },
  { id: "pink", name: "Pink", color: "#ec4899" },
];

// categories
const categories = [
  { id: "all", name: "All" },
  { id: "gradients", name: "Gradients" },
  { id: "solid", name: "Solid Colors" },
];

export const DesignSidebar = ({
  activeTool,
  onChangeActiveTool,
  editor,
}: DesignSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const onClose = () => {
    onChangeActiveTool("select");
  };

  // apply gradient background to canvas
  const applyGradientBackground = (
    gradient: (typeof backgroundGradients)[0],
  ) => {
    if (!editor?.canvas) return;

    const workspace = editor.getWorkspace();
    if (!workspace) return;

    // create fabric gradient
    const fabricGradient = new (window as any).fabric.Gradient({
      type: "linear",
      gradientUnits: "percentage",
      coords: { x1: 0, y1: 0, x2: 1, y2: 1 },
      colorStops: gradient.colors.map((color, index) => ({
        offset: index / (gradient.colors.length - 1),
        color: color,
      })),
    });

    workspace.set("fill", fabricGradient);
    editor.canvas.requestRenderAll();
    editor.save?.();
  };

  // apply solid color background to canvas
  const applySolidBackground = (color: string) => {
    if (!editor?.canvas) return;

    editor.changeBackground(color);
  };

  // filter items based on search and category
  const filteredGradients = backgroundGradients.filter((g) => {
    const matchesSearch = g.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || selectedCategory === "gradients";
    return matchesSearch && matchesCategory;
  });

  const filteredSolids = solidColors.filter((c) => {
    const matchesSearch = c.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || selectedCategory === "solid";
    return matchesSearch && matchesCategory;
  });

  return (
    <SidebarBase isVisible={activeTool === "templates"} onClose={onClose}>
      <ToolSidebarHeader
        title="Design"
        description="backgrounds and colors"
        icon={Layers3}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4 p-4"
        >
          {/* search input */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search backgrounds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-border bg-muted/30 focus:bg-background h-10 rounded-xl pl-10 text-sm transition-colors"
            />
          </div>

          {/* categories */}
          <div className="scrollbar-hide flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={ny(
                  "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        </motion.div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-6 pb-24">
            {/* gradient backgrounds */}
            {filteredGradients.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-muted-foreground size-4" />
                  <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                    Gradients
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {filteredGradients.map((gradient, index) => (
                    <motion.button
                      key={gradient.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03, duration: 0.2 }}
                      onClick={() => applyGradientBackground(gradient)}
                      className="group border-border hover:border-primary/50 relative aspect-[4/3] overflow-hidden rounded-xl border transition-all hover:shadow-lg"
                    >
                      <div
                        className="absolute inset-0 transition-transform duration-300 group-hover:scale-105"
                        style={{ background: gradient.gradient }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="absolute right-0 bottom-0 left-0 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <p className="text-[10px] font-medium text-white">
                          {gradient.name}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* solid colors */}
            {filteredSolids.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Palette className="text-muted-foreground size-4" />
                  <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                    Solid Colors
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {filteredSolids.map((solid, index) => (
                    <motion.button
                      key={solid.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.02, duration: 0.2 }}
                      onClick={() => applySolidBackground(solid.color)}
                      className={ny(
                        "group relative aspect-square overflow-hidden rounded-lg border transition-all hover:scale-105 hover:shadow-md",
                        solid.color === "#ffffff"
                          ? "border-border"
                          : "hover:border-primary/50 border-transparent",
                      )}
                      title={solid.name}
                    >
                      <div
                        className="absolute inset-0"
                        style={{ backgroundColor: solid.color }}
                      />
                      {solid.color === "#ffffff" && (
                        <div className="border-border absolute inset-0 border" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* empty state */}
            {filteredGradients.length === 0 && filteredSolids.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-muted/50 mb-3 flex size-12 items-center justify-center rounded-xl">
                  <Layers3 className="text-muted-foreground size-6" />
                </div>
                <p className="text-sm font-medium">No backgrounds found</p>
                <p className="text-muted-foreground text-xs">
                  try a different search term
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <ToolSidebarClose onClick={onClose} />
    </SidebarBase>
  );
};
