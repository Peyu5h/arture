"use client";

import {
  LayoutTemplate,
  Layers,
  Upload,
  ImageIcon,
  Type,
  Pentagon,
  PenTool,
} from "lucide-react";

import { SidebarItem } from "./sidebar-item";
import { UserMenu } from "./user-menu";
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
          icon={LayoutTemplate}
          label="Design"
          isActive={activeTool === "templates"}
          onClick={() => onChangeActiveTool("templates")}
        />
        <SidebarItem
          icon={Layers}
          label="Elements"
          isActive={activeTool === "elements"}
          onClick={() => onChangeActiveTool("elements")}
        />
        <SidebarItem
          icon={Upload}
          label="Uploads"
          isActive={activeTool === "uploads"}
          onClick={() => onChangeActiveTool("uploads")}
        />
        <SidebarItem
          icon={ImageIcon}
          label="Images"
          isActive={activeTool === "images"}
          onClick={() => onChangeActiveTool("images")}
        />
        <SidebarItem
          icon={Type}
          label="Text"
          isActive={activeTool === "text"}
          onClick={() => onChangeActiveTool("text")}
        />
        <SidebarItem
          icon={Pentagon}
          label="Shapes"
          isActive={activeTool === "shapes"}
          onClick={() => onChangeActiveTool("shapes")}
        />
        <SidebarItem
          icon={PenTool}
          label="Draw"
          isActive={activeTool === "draw"}
          onClick={() => onChangeActiveTool("draw")}
        />
      </nav>

      <div className="border-border border-t px-1 py-2">
        <UserMenu />
      </div>
    </aside>
  );
};
