import { useCallback, useEffect, useState } from "react";
import tinycolor from "tinycolor2";
import { Canvas } from "fabric/fabric-impl";

interface DocumentColor {
  color: string;
  shades: string[];
}

export const useDocumentColors = (canvas: Canvas | null | undefined) => {
  const [documentColors, setDocumentColors] = useState<DocumentColor[]>([]);

  const generateShades = (color: string): string[] => {
    const baseColor = tinycolor(color);
    const shades: string[] = [];

    for (let i = 20; i <= 80; i += 15) {
      if (baseColor.isDark()) {
        shades.push(baseColor.lighten(i).toHexString());
      } else {
        shades.push(baseColor.darken(i).toHexString());
      }
    }

    return shades;
  };

  const extractColors = useCallback(() => {
    if (!canvas) return;

    const colors = new Set<string>();
    canvas.getObjects().forEach((obj) => {
      if (obj.fill && typeof obj.fill === "string") {
        colors.add(obj.fill);
      }
      if (obj.stroke && typeof obj.stroke === "string") {
        colors.add(obj.stroke);
      }
    });

    const documentColors: DocumentColor[] = Array.from(colors).map((color) => ({
      color,
      shades: generateShades(color),
    }));

    setDocumentColors(documentColors);
  }, [canvas]);

  useEffect(() => {
    extractColors();

    if (canvas) {
      canvas.on("object:added", extractColors);
      canvas.on("object:modified", extractColors);
      canvas.on("object:removed", extractColors);

      return () => {
        canvas.off("object:added", extractColors);
        canvas.off("object:modified", extractColors);
        canvas.off("object:removed", extractColors);
      };
    }
  }, [canvas, extractColors]);

  return documentColors;
};
