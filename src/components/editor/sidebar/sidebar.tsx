"use client";

import {
  Layers3,
  ImagePlus,
  PenTool,
  SlidersHorizontal,
  Hexagon,
  Sparkles,
  TypeOutline,
  Boxes,
} from "lucide-react";

import { SidebarItem } from "./sidebar-item";
import { ActiveTool } from "../../../lib/types";

interface SidebarProps {
  activeTool: ActiveTool;
  onChangeActiveTool: (tool: ActiveTool) => void;
}

export const Sidebar = ({ activeTool, onChangeActiveTool }: SidebarProps) => {
  return (
    <aside className="bg-card border-border z-45 flex w-20 flex-shrink-0 flex-col border-r shadow-sm">
      <nav className="flex flex-1 flex-col gap-0.5 px-1 py-2">
        <SidebarItem
          icon={Layers3}
          label="Design"
          isActive={activeTool === "templates"}
          onClick={() => onChangeActiveTool("templates")}
        />
        <SidebarItem
          icon={ImagePlus}
          label="Image"
          isActive={activeTool === "images"}
          onClick={() => onChangeActiveTool("images")}
        />
        <SidebarItem
          icon={TypeOutline}
          label="Text"
          isActive={activeTool === "text"}
          onClick={() => onChangeActiveTool("text")}
        />
        <SidebarItem
          icon={Hexagon}
          label="Shapes"
          isActive={activeTool === "shapes"}
          onClick={() => onChangeActiveTool("shapes")}
        />
        <SidebarItem
          icon={Boxes}
          label="Elements"
          isActive={activeTool === "elements"}
          onClick={() => onChangeActiveTool("elements")}
        />
        <SidebarItem
          icon={PenTool}
          label="Draw"
          isActive={activeTool === "draw"}
          onClick={() => onChangeActiveTool("draw")}
        />
        <SidebarItem
          icon={Sparkles}
          label="AI"
          isActive={activeTool === "ai"}
          onClick={() => onChangeActiveTool("ai")}
        />
        <SidebarItem
          icon={SlidersHorizontal}
          label="Settings"
          isActive={activeTool === "settings"}
          onClick={() => onChangeActiveTool("settings")}
        />
      </nav>
    </aside>
  );
};
