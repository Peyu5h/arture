export {
  initWasm,
  isWebGPUSupported,
  createImageProcessor,
  getFilterMetadata,
  getAllFilterTypes,
  getFiltersByCategory,
  getFilterCategories,
  imageDataToUint8Array,
  uint8ArrayToImageData,
  getWasmLoadError,
  isWasmLoaded,
} from "./loader";

export type {
  WasmImageProcessorInstance,
  RotateResult,
  HistogramData,
  FilterMetadata,
} from "./loader";

export type {
  FilterCategory,
  FilterName,
  CropRegion,
  ImageDimensions,
  FilterOptions,
  ImageProcessingResult,
  WebGPUSupport,
} from "./types";

export {
  createFallbackProcessor,
  getFallbackProcessor,
  type FallbackProcessor,
} from "./fallback";
