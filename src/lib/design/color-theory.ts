// color theory utilities for design intelligence

export interface ColorHSL {
  h: number;
  s: number;
  l: number;
}

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface Palette {
  name: string;
  colors: string[];
  harmony: HarmonyType;
  mood?: string;
}

export type HarmonyType =
  | "complementary"
  | "analogous"
  | "triadic"
  | "split-complementary"
  | "tetradic"
  | "monochromatic";

// hex to hsl conversion
export function hexToHSL(hex: string): ColorHSL {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// hsl to hex conversion
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// calculate relative luminance for contrast
export function getLuminance(hex: string): number {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 0;

  const rgb = [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ].map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));

  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

// calculate contrast ratio between two colors
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// check if contrast meets wcag standards
export function checkContrast(
  foreground: string,
  background: string
): { ratio: number; aa: boolean; aaa: boolean; aaLarge: boolean } {
  const ratio = getContrastRatio(foreground, background);
  return {
    ratio: Math.round(ratio * 100) / 100,
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
    aaLarge: ratio >= 3,
  };
}

// determine if color is light or dark
export function isLightColor(hex: string): boolean {
  return getLuminance(hex) > 0.5;
}

// get recommended text color for background
export function getTextColor(background: string): string {
  return isLightColor(background) ? "#1A1A2E" : "#FFFFFF";
}

// generate complementary color
function getComplementary(hsl: ColorHSL): ColorHSL[] {
  return [{ ...hsl }, { h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l }];
}

// generate analogous colors
function getAnalogous(hsl: ColorHSL): ColorHSL[] {
  return [
    { h: (hsl.h - 30 + 360) % 360, s: hsl.s, l: hsl.l },
    { ...hsl },
    { h: (hsl.h + 30) % 360, s: hsl.s, l: hsl.l },
  ];
}

// generate triadic colors
function getTriadic(hsl: ColorHSL): ColorHSL[] {
  return [
    { ...hsl },
    { h: (hsl.h + 120) % 360, s: hsl.s, l: hsl.l },
    { h: (hsl.h + 240) % 360, s: hsl.s, l: hsl.l },
  ];
}

// generate split-complementary colors
function getSplitComplementary(hsl: ColorHSL): ColorHSL[] {
  return [
    { ...hsl },
    { h: (hsl.h + 150) % 360, s: hsl.s, l: hsl.l },
    { h: (hsl.h + 210) % 360, s: hsl.s, l: hsl.l },
  ];
}

// generate tetradic colors
function getTetradic(hsl: ColorHSL): ColorHSL[] {
  return [
    { ...hsl },
    { h: (hsl.h + 90) % 360, s: hsl.s, l: hsl.l },
    { h: (hsl.h + 180) % 360, s: hsl.s, l: hsl.l },
    { h: (hsl.h + 270) % 360, s: hsl.s, l: hsl.l },
  ];
}

// generate monochromatic palette
function getMonochromatic(hsl: ColorHSL): ColorHSL[] {
  return [
    { h: hsl.h, s: hsl.s, l: Math.max(15, hsl.l - 30) },
    { h: hsl.h, s: hsl.s, l: Math.max(25, hsl.l - 15) },
    { ...hsl },
    { h: hsl.h, s: hsl.s, l: Math.min(85, hsl.l + 15) },
    { h: hsl.h, s: hsl.s, l: Math.min(95, hsl.l + 30) },
  ];
}

// generate palette based on harmony type
export function generatePalette(
  baseColor: string,
  harmony: HarmonyType = "complementary"
): Palette {
  const hsl = hexToHSL(baseColor);
  let hslColors: ColorHSL[];

  switch (harmony) {
    case "complementary":
      hslColors = getComplementary(hsl);
      break;
    case "analogous":
      hslColors = getAnalogous(hsl);
      break;
    case "triadic":
      hslColors = getTriadic(hsl);
      break;
    case "split-complementary":
      hslColors = getSplitComplementary(hsl);
      break;
    case "tetradic":
      hslColors = getTetradic(hsl);
      break;
    case "monochromatic":
      hslColors = getMonochromatic(hsl);
      break;
    default:
      hslColors = [hsl];
  }

  // expand to 5 colors if needed
  while (hslColors.length < 5) {
    const last = hslColors[hslColors.length - 1];
    hslColors.push({
      h: last.h,
      s: Math.max(20, last.s - 15),
      l: Math.min(90, last.l + 10),
    });
  }

  const colors = hslColors.slice(0, 5).map((c) => hslToHex(c.h, c.s, c.l));

  const harmonyNames: Record<HarmonyType, string> = {
    complementary: "Complementary Palette",
    analogous: "Analogous Palette",
    triadic: "Triadic Palette",
    "split-complementary": "Split-Complementary Palette",
    tetradic: "Tetradic Palette",
    monochromatic: "Monochromatic Palette",
  };

  return {
    name: harmonyNames[harmony],
    colors,
    harmony,
  };
}

// generate 5-color palette with automatic harmony selection
export function suggestPalette(baseColor: string): Palette {
  const hsl = hexToHSL(baseColor);

  // choose harmony based on saturation and lightness
  let harmony: HarmonyType;

  if (hsl.s < 20) {
    harmony = "monochromatic";
  } else if (hsl.l > 70 || hsl.l < 30) {
    harmony = "analogous";
  } else if (hsl.s > 60) {
    harmony = "triadic";
  } else {
    harmony = "complementary";
  }

  return generatePalette(baseColor, harmony);
}

// generate all harmony variations
export function generateAllPalettes(baseColor: string): Palette[] {
  const harmonies: HarmonyType[] = [
    "complementary",
    "analogous",
    "triadic",
    "split-complementary",
    "tetradic",
    "monochromatic",
  ];

  return harmonies.map((h) => generatePalette(baseColor, h));
}

// mood-based palette generation
export function generateMoodPalette(
  mood: "warm" | "cool" | "neutral" | "vibrant" | "muted" | "dark" | "light"
): Palette {
  const moodColors: Record<string, { base: string; harmony: HarmonyType }> = {
    warm: { base: "#E94560", harmony: "analogous" },
    cool: { base: "#4ECDC4", harmony: "analogous" },
    neutral: { base: "#6B7280", harmony: "monochromatic" },
    vibrant: { base: "#FF6B6B", harmony: "triadic" },
    muted: { base: "#9CA3AF", harmony: "analogous" },
    dark: { base: "#1F2937", harmony: "monochromatic" },
    light: { base: "#F3F4F6", harmony: "monochromatic" },
  };

  const config = moodColors[mood] || moodColors.neutral;
  const palette = generatePalette(config.base, config.harmony);
  palette.mood = mood;
  palette.name = `${mood.charAt(0).toUpperCase() + mood.slice(1)} Palette`;

  return palette;
}

// predefined palettes for common design needs
export const PRESET_PALETTES: Palette[] = [
  {
    name: "Modern Dark",
    colors: ["#1A1A2E", "#16213E", "#0F3460", "#E94560", "#FFFFFF"],
    harmony: "complementary",
    mood: "professional",
  },
  {
    name: "Clean Minimal",
    colors: ["#FFFFFF", "#F8F9FA", "#E9ECEF", "#212529", "#495057"],
    harmony: "monochromatic",
    mood: "minimal",
  },
  {
    name: "Vibrant Energy",
    colors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"],
    harmony: "triadic",
    mood: "playful",
  },
  {
    name: "Elegant Gold",
    colors: ["#1A1A2E", "#2D2D44", "#D4AF37", "#F5E6C8", "#FFFFFF"],
    harmony: "complementary",
    mood: "luxury",
  },
  {
    name: "Nature Green",
    colors: ["#2D5016", "#4A7C23", "#6B8E23", "#9ACD32", "#F0FFF0"],
    harmony: "monochromatic",
    mood: "organic",
  },
  {
    name: "Ocean Blue",
    colors: ["#003366", "#006699", "#0099CC", "#66CCFF", "#E6F3FF"],
    harmony: "monochromatic",
    mood: "calm",
  },
  {
    name: "Sunset Warm",
    colors: ["#FF4500", "#FF6347", "#FF7F50", "#FFA07A", "#FFDAB9"],
    harmony: "analogous",
    mood: "warm",
  },
  {
    name: "Royal Purple",
    colors: ["#2E1A47", "#4B2D73", "#6B3FA0", "#9B59B6", "#E8DAEF"],
    harmony: "monochromatic",
    mood: "regal",
  },
];
