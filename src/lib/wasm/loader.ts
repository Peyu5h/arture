export interface WasmImageProcessorInstance {
  apply_filter(
    imageData: Uint8Array,
    width: number,
    height: number,
    filterType: string,
    intensity: number,
  ): Uint8Array;
  crop(
    imageData: Uint8Array,
    width: number,
    height: number,
    x: number,
    y: number,
    cropWidth: number,
    cropHeight: number,
  ): Uint8Array;
  resize(
    imageData: Uint8Array,
    srcWidth: number,
    srcHeight: number,
    dstWidth: number,
    dstHeight: number,
  ): Uint8Array;
  rotate(
    imageData: Uint8Array,
    width: number,
    height: number,
    degrees: number,
  ): RotateResult;
  flip(
    imageData: Uint8Array,
    width: number,
    height: number,
    horizontal: boolean,
  ): Uint8Array;
  adjust_hue(
    imageData: Uint8Array,
    width: number,
    height: number,
    hueShift: number,
  ): Uint8Array;
  get_histogram(imageData: Uint8Array): HistogramData;
  free(): void;
}

export interface RotateResult {
  data: Uint8Array;
  width: number;
  height: number;
}

export interface HistogramData {
  red: Uint32Array;
  green: Uint32Array;
  blue: Uint32Array;
  luminance: Uint32Array;
}

export interface FilterMetadata {
  name: string;
  description: string;
  category: string;
  default_intensity: number;
  min_intensity: number;
  max_intensity: number;
}

interface WasmExports {
  ImageProcessor: {
    new (): WasmImageProcessorInstance;
    is_supported(): Promise<boolean>;
  };
  get_filter_metadata(filterType: string): FilterMetadata | null;
  get_all_filter_types(): string[];
  get_filters_by_category(category: string): string[];
  get_filter_categories(): string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wasmModule: WasmExports | null = null;
let wasmInitPromise: Promise<WasmExports | null> | null = null;
let wasmLoadError: Error | null = null;

async function loadWasmModule(): Promise<WasmExports | null> {
  if (wasmModule) return wasmModule;
  if (wasmLoadError) return null;
  if (wasmInitPromise) return wasmInitPromise;

  wasmInitPromise = (async () => {
    try {
      if (typeof window === "undefined") {
        return null;
      }

      const wasmResponse = await fetch("/wasm/arture_wasm_bg.wasm");
      if (!wasmResponse.ok) {
        throw new Error(`wasm fetch failed: ${wasmResponse.status}`);
      }
      const wasmBytes = await wasmResponse.arrayBuffer();

      const jsResponse = await fetch("/wasm/arture_wasm.js");
      if (!jsResponse.ok) {
        throw new Error(`js fetch failed: ${jsResponse.status}`);
      }
      const jsCode = await jsResponse.text();

      const blob = new Blob([jsCode], { type: "application/javascript" });
      const blobUrl = URL.createObjectURL(blob);

      try {
        const jsModule = await import(/* webpackIgnore: true */ blobUrl);
        await jsModule.default(wasmBytes);
        wasmModule = jsModule as WasmExports;
        return wasmModule;
      } finally {
        URL.revokeObjectURL(blobUrl);
      }
    } catch (error) {
      wasmLoadError = error instanceof Error ? error : new Error(String(error));
      console.warn("wasm load failed:", wasmLoadError.message);
      return null;
    }
  })();

  return wasmInitPromise;
}

export async function initWasm(): Promise<WasmExports | null> {
  return loadWasmModule();
}

export async function isWebGPUSupported(): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false;

    const nav = navigator as Navigator & { gpu?: unknown };
    if (!nav.gpu) return false;

    const wasm = await loadWasmModule();
    if (!wasm) return false;

    return await wasm.ImageProcessor.is_supported();
  } catch {
    return false;
  }
}

export async function createImageProcessor(): Promise<WasmImageProcessorInstance | null> {
  try {
    const wasm = await loadWasmModule();
    if (!wasm) return null;
    return new wasm.ImageProcessor();
  } catch (error) {
    console.error("create processor failed:", error);
    return null;
  }
}

export async function getFilterMetadata(
  filterType: string,
): Promise<FilterMetadata | null> {
  try {
    const wasm = await loadWasmModule();
    if (!wasm) return getDefaultFilterMetadata(filterType);
    const meta = wasm.get_filter_metadata(filterType);
    if (!meta) return null;
    return {
      name: meta.name,
      description: meta.description,
      category: meta.category,
      default_intensity: meta.default_intensity,
      min_intensity: meta.min_intensity,
      max_intensity: meta.max_intensity,
    };
  } catch {
    return getDefaultFilterMetadata(filterType);
  }
}

export async function getAllFilterTypes(): Promise<string[]> {
  try {
    const wasm = await loadWasmModule();
    if (!wasm) return getDefaultFilterTypes();
    return wasm.get_all_filter_types();
  } catch {
    return getDefaultFilterTypes();
  }
}

export async function getFiltersByCategory(
  category: string,
): Promise<string[]> {
  try {
    const wasm = await loadWasmModule();
    if (!wasm) return getDefaultFiltersByCategory(category);
    return wasm.get_filters_by_category(category);
  } catch {
    return getDefaultFiltersByCategory(category);
  }
}

export async function getFilterCategories(): Promise<string[]> {
  try {
    const wasm = await loadWasmModule();
    if (!wasm) return ["color", "adjustment", "effect", "artistic", "preset"];
    return wasm.get_filter_categories();
  } catch {
    return ["color", "adjustment", "effect", "artistic", "preset"];
  }
}

export function imageDataToUint8Array(imageData: ImageData): Uint8Array {
  return new Uint8Array(imageData.data.buffer);
}

export function uint8ArrayToImageData(
  data: Uint8Array,
  width: number,
  height: number,
): ImageData {
  const clampedArray = new Uint8ClampedArray(data);
  return new ImageData(clampedArray, width, height);
}

export function getWasmLoadError(): Error | null {
  return wasmLoadError;
}

export function isWasmLoaded(): boolean {
  return wasmModule !== null;
}

function getDefaultFilterTypes(): string[] {
  return [
    "grayscale",
    "sepia",
    "invert",
    "brightness",
    "contrast",
    "saturation",
    "blur",
    "sharpen",
    "vignette",
    "vintage",
    "warm",
    "cool",
    "posterize",
    "emboss",
    "edge_detect",
    "noise",
    "pixelate",
    "chromatic_aberration",
  ];
}

function getDefaultFiltersByCategory(category: string): string[] {
  const categoryMap: Record<string, string[]> = {
    color: ["grayscale", "sepia", "invert", "warm", "cool"],
    adjustment: ["brightness", "contrast", "saturation"],
    effect: ["blur", "sharpen", "vignette", "noise", "chromatic_aberration"],
    artistic: ["posterize", "emboss", "edge_detect", "pixelate"],
    preset: ["vintage"],
  };
  return categoryMap[category] ?? [];
}

function getDefaultFilterMetadata(filterType: string): FilterMetadata | null {
  const metadata: Record<string, FilterMetadata> = {
    grayscale: {
      name: "Grayscale",
      description: "Convert image to black and white",
      category: "color",
      default_intensity: 1.0,
      min_intensity: 0.0,
      max_intensity: 1.0,
    },
    sepia: {
      name: "Sepia",
      description: "Apply warm brownish tone",
      category: "color",
      default_intensity: 1.0,
      min_intensity: 0.0,
      max_intensity: 1.0,
    },
    brightness: {
      name: "Brightness",
      description: "Adjust image brightness",
      category: "adjustment",
      default_intensity: 0.5,
      min_intensity: 0.0,
      max_intensity: 1.0,
    },
    contrast: {
      name: "Contrast",
      description: "Adjust image contrast",
      category: "adjustment",
      default_intensity: 0.5,
      min_intensity: 0.0,
      max_intensity: 1.0,
    },
    saturation: {
      name: "Saturation",
      description: "Adjust color saturation",
      category: "adjustment",
      default_intensity: 0.5,
      min_intensity: 0.0,
      max_intensity: 1.0,
    },
    blur: {
      name: "Blur",
      description: "Apply gaussian blur",
      category: "effect",
      default_intensity: 0.3,
      min_intensity: 0.0,
      max_intensity: 1.0,
    },
  };
  return metadata[filterType] ?? null;
}
