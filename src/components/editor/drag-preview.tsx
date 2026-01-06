"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ny } from "~/lib/utils";
import { DragItem } from "~/contexts/drag-context";
import {
  FaCircle,
  FaSquare,
  FaSquareFull,
  FaRegCircle,
  FaRegSquare,
} from "react-icons/fa";
import { IoTriangle } from "react-icons/io5";
import { FaDiamond } from "react-icons/fa6";
import {
  Pentagon,
  Hexagon,
  Octagon,
  Star,
  Heart,
  Minus,
  ArrowRight,
  MoveRight,
  Triangle,
} from "lucide-react";

interface DragPreviewProps {
  item: DragItem | null;
  position: { x: number; y: number };
  isOverCanvas: boolean;
  isDragging: boolean;
}

const ShapePreview = ({ shapeType }: { shapeType: string }) => {
  const baseStyle = "size-12 text-foreground drop-shadow-md";
  const lucideStyle = "size-12 text-foreground drop-shadow-md";

  switch (shapeType) {
    case "circle":
      return <FaCircle className={baseStyle} />;
    case "rectangle":
      return <FaSquareFull className={baseStyle} />;
    case "softRectangle":
      return <FaSquare className={baseStyle} />;
    case "triangle":
      return <IoTriangle className={baseStyle} />;
    case "inverseTriangle":
      return <IoTriangle className={ny(baseStyle, "rotate-180")} />;
    case "diamond":
      return <FaDiamond className={baseStyle} />;
    case "pentagon":
      return <Pentagon className={lucideStyle} fill="currentColor" />;
    case "hexagon":
      return <Hexagon className={lucideStyle} fill="currentColor" />;
    case "octagon":
      return <Octagon className={lucideStyle} fill="currentColor" />;
    case "star":
      return <Star className={lucideStyle} fill="currentColor" />;
    case "heart":
      return <Heart className={lucideStyle} fill="currentColor" />;
    case "line":
      return <Minus className={lucideStyle} strokeWidth={3} />;
    case "arrow":
      return <ArrowRight className={lucideStyle} strokeWidth={2} />;
    case "doubleArrow":
      return <MoveRight className={lucideStyle} strokeWidth={2} />;
    case "circle-outline":
      return <FaRegCircle className={baseStyle} />;
    case "square-outline":
      return <FaRegSquare className={baseStyle} />;
    case "triangle-outline":
      return <Triangle className={lucideStyle} />;
    case "pentagon-outline":
      return <Pentagon className={lucideStyle} strokeWidth={1.5} />;
    case "hexagon-outline":
      return <Hexagon className={lucideStyle} strokeWidth={1.5} />;
    case "star-outline":
      return <Star className={lucideStyle} strokeWidth={1.5} />;
    default:
      return <FaSquare className={baseStyle} />;
  }
};

const TextPreview = ({
  textType,
  options,
}: {
  textType: string;
  options?: Record<string, any>;
}) => {
  const text = options?.text || "Text";

  switch (textType) {
    case "heading":
      return (
        <div className="bg-card border-border rounded-lg border px-4 py-2 shadow-lg">
          <span className="text-2xl font-bold">{text}</span>
        </div>
      );
    case "subheading":
      return (
        <div className="bg-card border-border rounded-lg border px-4 py-2 shadow-lg">
          <span className="text-lg font-semibold">{text}</span>
        </div>
      );
    case "body":
      return (
        <div className="bg-card border-border rounded-lg border px-4 py-2 shadow-lg">
          <span className="text-sm">{text}</span>
        </div>
      );
    default:
      return (
        <div className="bg-card border-border rounded-lg border px-4 py-2 shadow-lg">
          <span className="text-sm">{text}</span>
        </div>
      );
  }
};

const ImagePreview = ({
  thumbnail,
  url,
}: {
  thumbnail?: string;
  url?: string;
}) => {
  const src = thumbnail || url;

  if (!src) return null;

  return (
    <img
      src={src}
      alt="Preview"
      className="border-border size-20 rounded-lg border object-cover shadow-lg"
      draggable={false}
    />
  );
};

const getPreviewContent = (item: DragItem) => {
  if (item.type === "shape") {
    return <ShapePreview shapeType={item.data.shapeType as string} />;
  }

  if (item.type === "text") {
    return (
      <TextPreview
        textType={item.data.textType as string}
        options={item.data.options as Record<string, any>}
      />
    );
  }

  if (item.type === "image") {
    return (
      <ImagePreview
        thumbnail={item.data.thumbnail as string}
        url={item.data.url as string}
      />
    );
  }

  return null;
};

export const DragPreview = ({
  item,
  position,
  isOverCanvas,
  isDragging,
}: DragPreviewProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isDragging || !item) return null;

  const content = getPreviewContent(item);

  return createPortal(
    <div
      className={ny(
        "pointer-events-none fixed z-[9999]",
        isOverCanvas ? "opacity-90" : "opacity-70",
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
      }}
    >
      {content}
    </div>,
    document.body,
  );
};
