export interface WasmModule {
  ImageProcessor: ImageProcessorConstructor;
  FilterType: FilterTypeEnum;
  FilterMetadata: FilterMetadataClass;
  RotateResult: RotateResultClass;
  HistogramData: HistogramDataClass;
  get_filter_metadata: (filterType: string) => FilterMetadata | undefined;
  get_all_filter_types: () => string[];
  get_filters_by_category: (category: string) => string[];
  get_filter_categories: () => string[];
}

export interface ImageProcessorConstructor {
  new (): Promise<ImageProcessor>;
  is_supported(): Promise<boolean>;
}

export interface ImageProcessor {
  apply_filter(
    imageData: Uint8Array,
    width: number,
    height: number,
    filterType: string,
    intensity: number
  ): Promise<Uint8Array>;

  crop(
    imageData: Uint8Array,
    width: number,
    height: number,
    x: number,
    y: number,
    cropWidth: number,
    cropHeight: number
  ): Uint8Array;

  resize(
    imageData: Uint8Array,
    srcWidth: number,
    srcHeight: number,
    dstWidth: number,
    dstHeight: number
  ): Uint8Array;

  rotate(
    imageData: Uint8Array,
    width: number,
    height: number,
    degrees: number
  ): RotateResult;

  flip(
    imageData: Uint8Array,
    width: number,
    height: number,
    horizontal: boolean
  ): Uint8Array;

  adjust_hue(
    imageData: Uint8Array,
    width: number,
    height: number,
    hueShift: number
  ): Uint8Array;

  get_histogram(imageData: Uint8Array): HistogramData;
}

export interface FilterTypeEnum {
  Grayscale: number;
  Sepia: number;
  Invert: number;
  Brightness: number;
  Contrast: number;
  Saturation: number;
  Blur: number;
  Sharpen: number;
  Vignette: number;
  Vintage: number;
  Warm: number;
  Cool: number;
  Posterize: number;
  Emboss: number;
  EdgeDetect: number;
  Noise: number;
  Pixelate: number;
  ChromaticAberration: number;
}

export interface FilterMetadataClass {
  new (
    name: string,
    description: string,
    category: string,
    defaultIntensity: number,
    minIntensity: number,
    maxIntensity: number
  ): FilterMetadata;
}

export interface FilterMetadata {
  name: string;
  description: string;
  category: string;
  default_intensity: number;
  min_intensity: number;
  max_intensity: number;
}

export interface RotateResultClass {
  new (): RotateResult;
}

export interface RotateResult {
  data: Uint8Array;
  width: number;
  height: number;
}

export interface HistogramDataClass {
  new (): HistogramData;
}

export interface HistogramData {
  red: Uint32Array;
  green: Uint32Array;
  blue: Uint32Array;
  luminance: Uint32Array;
}

export type FilterCategory =
  | "color"
  | "adjustment"
  | "effect"
  | "artistic"
  | "preset";

export type FilterName =
  | "grayscale"
  | "sepia"
  | "invert"
  | "brightness"
  | "contrast"
  | "saturation"
  | "blur"
  | "sharpen"
  | "vignette"
  | "vintage"
  | "warm"
  | "cool"
  | "posterize"
  | "emboss"
  | "edge_detect"
  | "noise"
  | "pixelate"
  | "chromatic_aberration";

export interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface FilterOptions {
  filterType: FilterName;
  intensity: number;
}

export interface ImageProcessingResult {
  data: Uint8Array;
  width: number;
  height: number;
}

export interface WebGPUSupport {
  supported: boolean;
  reason?: string;
}
