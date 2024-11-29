import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RGBColor } from "react-color";

export function ny(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isText(type: string | undefined) {
  return type === "text" || type === "i-text" || type === "textbox";
}

export function rgbaObjectToString(rgba: RGBColor | "transparent") {
  if (rgba === "transparent") {
    return `rgba(0,0,0,0)`;
  }

  const alpha = rgba.a === undefined ? 1 : rgba.a;

  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${alpha})`;
}

export function rgbaToHex(rgba: string): string {
  if (!rgba) return "#000000";

  const match = rgba.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/,
  );
  if (!match) return "#000000";

  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);

  const toHex = (n: number): string => {
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbaObjectToHex(rgba: any): string {
  if (!rgba || rgba === "transparent") return "#000000";

  const r = rgba.r || 0;
  const g = rgba.g || 0;
  const b = rgba.b || 0;

  const toHex = (n: number): string => {
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
