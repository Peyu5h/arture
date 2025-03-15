import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RGBColor } from "react-color";
import { v4 as uuid } from "uuid";
import { jsPDF } from "jspdf";
import { formatDistanceToNowStrict, isValid } from "date-fns";

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

export function downloadFile(file: string, type: string) {
  const anchorElement = document.createElement("a");

  anchorElement.href = file;
  anchorElement.download = `${uuid()}.${type}`;
  document.body.appendChild(anchorElement);
  anchorElement.click();
  anchorElement.remove();
}

export function transformText(objects: any) {
  if (!objects) return;

  objects.forEach((item: any) => {
    if (item.objects) {
      transformText(item.objects);
    } else {
      if (item.type === "text" || item.type === "textbox") {
        console.log("Item is of type text or textbox");
      }
    }
  });
}

export async function downloadPdf(imageBlob: Blob, filename: string) {
  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
    });

    const reader = new FileReader();
    const base64Promise = new Promise((resolve) => {
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(imageBlob);
    });

    const base64Image = (await base64Promise) as string;

    const imgProps = pdf.getImageProperties(base64Image);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(base64Image, "PNG", 0, 0, pdfWidth, pdfHeight);

    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF");
  }
}

export const fetchCallback = ({
  setIsPending,
}: {
  setIsPending: (value: boolean) => void;
}) => {
  return {
    onRequest: () => {
      setIsPending(true);
    },
    onResponse: () => {
      setIsPending(false);
    },
  };
};

export function formatDistanceToNow(
  date: Date | number | string,
  options?: { addSuffix?: boolean; includeSeconds?: boolean },
): string {
  try {
    // Handle string dates
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Validate the date
    if (!isValid(dateObj)) {
      return "Invalid date";
    }

    // Use date-fns to format the distance
    return formatDistanceToNowStrict(dateObj, {
      addSuffix: options?.addSuffix ?? false,
      ...options,
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
}
