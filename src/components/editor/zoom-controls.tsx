"use client";

import React from "react";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Maximize, Minus, Plus, Square, RefreshCcw } from "lucide-react";
import { cn } from "~/lib/utils";

interface ZoomControlsProps {
  editor: any;
  className?: string;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  editor,
  className,
}) => {
  const [zoomPercentage, setZoomPercentage] = React.useState(100);
  React.useEffect(() => {
    const updateZoom = () => {
      const currentZoom = editor?.getCurrentZoom?.() || 1;
      const percentage = Math.round(currentZoom * 100);
      setZoomPercentage(percentage);
    };

    updateZoom();

    const interval = setInterval(updateZoom, 50);

    return () => clearInterval(interval);
  }, [editor]);

  return (
    <div
      className={cn(
        "bg-background/80 flex items-center gap-1 rounded-lg border p-1 shadow-lg backdrop-blur-sm",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={editor?.zoomOut}
        className={cn(
          "hover:bg-accent h-8 w-8 p-0",
          zoomPercentage <= 30 && "cursor-not-allowed opacity-50",
        )}
        title="Zoom Out ([)"
        disabled={zoomPercentage <= 30}
      >
        <Minus className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-1 px-2">
        <span className="text-muted-foreground min-w-[3rem] text-center text-xs font-medium">
          {zoomPercentage}%
        </span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={editor?.zoomIn}
        className={cn(
          "hover:bg-accent h-8 w-8 p-0",
          zoomPercentage >= 120 && "cursor-not-allowed opacity-50",
        )}
        title="Zoom In (])"
        disabled={zoomPercentage >= 120}
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Button
        variant="ghost"
        size="sm"
        onClick={editor?.centerWorkspace}
        className="hover:bg-accent h-8 w-8 p-0"
        title="Center Workspace"
      >
        <RefreshCcw className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={editor?.resetZoom}
        className="hover:bg-accent h-8 w-8 p-0"
        title="Reset Zoom (0)"
      >
        <Maximize className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={editor?.fitToScreen}
        className="hover:bg-accent h-8 w-8 p-0"
        title="Fit to Screen"
      >
        <Square className="h-4 w-4" />
      </Button>
    </div>
  );
};
