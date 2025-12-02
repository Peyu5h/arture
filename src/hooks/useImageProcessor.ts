import { useState, useEffect, useCallback, useRef } from "react";
import {
  createImageProcessor,
  isWebGPUSupported,
  getAllFilterTypes,
  getFiltersByCategory,
  getFilterCategories,
  getFilterMetadata,
  imageDataToUint8Array,
  uint8ArrayToImageData,
  type WasmImageProcessorInstance,
  type FilterMetadata,
  type HistogramData,
  type RotateResult,
} from "~/lib/wasm/loader";
import {
  getFallbackProcessor,
  type FallbackProcessor,
} from "~/lib/wasm/fallback";

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

export interface ProcessorState {
  isLoading: boolean;
  isSupported: boolean;
  isUsingFallback: boolean;
  error: string | null;
  isProcessing: boolean;
}

export interface UseImageProcessorReturn {
  state: ProcessorState;
  applyFilter: (
    imageData: ImageData,
    filterType: FilterName,
    intensity?: number,
  ) => Promise<ImageData | null>;
  crop: (imageData: ImageData, region: CropRegion) => Promise<ImageData | null>;
  resize: (
    imageData: ImageData,
    newWidth: number,
    newHeight: number,
  ) => Promise<ImageData | null>;
  rotate: (
    imageData: ImageData,
    degrees: number,
  ) => Promise<{ imageData: ImageData; width: number; height: number } | null>;
  flip: (
    imageData: ImageData,
    horizontal: boolean,
  ) => Promise<ImageData | null>;
  adjustHue: (
    imageData: ImageData,
    hueShift: number,
  ) => Promise<ImageData | null>;
  getHistogram: (imageData: ImageData) => Promise<HistogramData | null>;
  getFilterTypes: () => Promise<string[]>;
  getCategories: () => Promise<string[]>;
  getFiltersForCategory: (category: string) => Promise<string[]>;
  getMetadata: (filterType: string) => Promise<FilterMetadata | null>;
}

export function useImageProcessor(): UseImageProcessorReturn {
  const [state, setState] = useState<ProcessorState>({
    isLoading: true,
    isSupported: false,
    isUsingFallback: false,
    error: null,
    isProcessing: false,
  });

  const processorRef = useRef<WasmImageProcessorInstance | null>(null);
  const fallbackRef = useRef<FallbackProcessor | null>(null);
  const initializingRef = useRef(false);

  useEffect(() => {
    async function initProcessor() {
      if (initializingRef.current) return;
      initializingRef.current = true;

      try {
        const supported = await isWebGPUSupported();

        if (!supported) {
          fallbackRef.current = getFallbackProcessor();
          setState({
            isLoading: false,
            isSupported: true,
            isUsingFallback: true,
            error: null,
            isProcessing: false,
          });
          return;
        }

        const processor = await createImageProcessor();

        if (!processor) {
          fallbackRef.current = getFallbackProcessor();
          setState({
            isLoading: false,
            isSupported: true,
            isUsingFallback: true,
            error: null,
            isProcessing: false,
          });
          return;
        }

        processorRef.current = processor;
        setState({
          isLoading: false,
          isSupported: true,
          isUsingFallback: false,
          error: null,
          isProcessing: false,
        });
      } catch (err) {
        fallbackRef.current = getFallbackProcessor();
        setState({
          isLoading: false,
          isSupported: true,
          isUsingFallback: true,
          error: err instanceof Error ? err.message : "Unknown error",
          isProcessing: false,
        });
      }
    }

    initProcessor();
  }, []);

  const setProcessing = useCallback((processing: boolean) => {
    setState((prev) => ({ ...prev, isProcessing: processing }));
  }, []);

  const applyFilter = useCallback(
    async (
      imageData: ImageData,
      filterType: FilterName,
      intensity: number = 1.0,
    ): Promise<ImageData | null> => {
      setProcessing(true);
      try {
        if (processorRef.current) {
          const inputData = imageDataToUint8Array(imageData);
          const result = processorRef.current.apply_filter(
            inputData,
            imageData.width,
            imageData.height,
            filterType,
            intensity,
          );
          return uint8ArrayToImageData(
            result,
            imageData.width,
            imageData.height,
          );
        } else if (fallbackRef.current) {
          return fallbackRef.current.applyFilter(
            imageData,
            filterType,
            intensity,
          );
        }
        return null;
      } catch (err) {
        console.error("filter error:", err);
        if (fallbackRef.current) {
          return fallbackRef.current.applyFilter(
            imageData,
            filterType,
            intensity,
          );
        }
        return null;
      } finally {
        setProcessing(false);
      }
    },
    [setProcessing],
  );

  const crop = useCallback(
    async (
      imageData: ImageData,
      region: CropRegion,
    ): Promise<ImageData | null> => {
      setProcessing(true);
      try {
        if (processorRef.current) {
          const inputData = imageDataToUint8Array(imageData);
          const result = processorRef.current.crop(
            inputData,
            imageData.width,
            imageData.height,
            region.x,
            region.y,
            region.width,
            region.height,
          );
          return uint8ArrayToImageData(result, region.width, region.height);
        } else if (fallbackRef.current) {
          return fallbackRef.current.crop(
            imageData,
            region.x,
            region.y,
            region.width,
            region.height,
          );
        }
        return null;
      } catch (err) {
        console.error("crop error:", err);
        if (fallbackRef.current) {
          return fallbackRef.current.crop(
            imageData,
            region.x,
            region.y,
            region.width,
            region.height,
          );
        }
        return null;
      } finally {
        setProcessing(false);
      }
    },
    [setProcessing],
  );

  const resize = useCallback(
    async (
      imageData: ImageData,
      newWidth: number,
      newHeight: number,
    ): Promise<ImageData | null> => {
      setProcessing(true);
      try {
        if (processorRef.current) {
          const inputData = imageDataToUint8Array(imageData);
          const result = processorRef.current.resize(
            inputData,
            imageData.width,
            imageData.height,
            newWidth,
            newHeight,
          );
          return uint8ArrayToImageData(result, newWidth, newHeight);
        } else if (fallbackRef.current) {
          return fallbackRef.current.resize(imageData, newWidth, newHeight);
        }
        return null;
      } catch (err) {
        console.error("resize error:", err);
        if (fallbackRef.current) {
          return fallbackRef.current.resize(imageData, newWidth, newHeight);
        }
        return null;
      } finally {
        setProcessing(false);
      }
    },
    [setProcessing],
  );

  const rotate = useCallback(
    async (
      imageData: ImageData,
      degrees: number,
    ): Promise<{
      imageData: ImageData;
      width: number;
      height: number;
    } | null> => {
      setProcessing(true);
      try {
        if (processorRef.current) {
          const inputData = imageDataToUint8Array(imageData);
          const result: RotateResult = processorRef.current.rotate(
            inputData,
            imageData.width,
            imageData.height,
            degrees,
          );
          return {
            imageData: uint8ArrayToImageData(
              result.data,
              result.width,
              result.height,
            ),
            width: result.width,
            height: result.height,
          };
        } else if (fallbackRef.current) {
          const result = fallbackRef.current.rotate(imageData, degrees);
          return {
            imageData: result.data,
            width: result.width,
            height: result.height,
          };
        }
        return null;
      } catch (err) {
        console.error("rotate error:", err);
        if (fallbackRef.current) {
          const result = fallbackRef.current.rotate(imageData, degrees);
          return {
            imageData: result.data,
            width: result.width,
            height: result.height,
          };
        }
        return null;
      } finally {
        setProcessing(false);
      }
    },
    [setProcessing],
  );

  const flip = useCallback(
    async (
      imageData: ImageData,
      horizontal: boolean,
    ): Promise<ImageData | null> => {
      setProcessing(true);
      try {
        if (processorRef.current) {
          const inputData = imageDataToUint8Array(imageData);
          const result = processorRef.current.flip(
            inputData,
            imageData.width,
            imageData.height,
            horizontal,
          );
          return uint8ArrayToImageData(
            result,
            imageData.width,
            imageData.height,
          );
        } else if (fallbackRef.current) {
          return fallbackRef.current.flip(imageData, horizontal);
        }
        return null;
      } catch (err) {
        console.error("flip error:", err);
        if (fallbackRef.current) {
          return fallbackRef.current.flip(imageData, horizontal);
        }
        return null;
      } finally {
        setProcessing(false);
      }
    },
    [setProcessing],
  );

  const adjustHue = useCallback(
    async (
      imageData: ImageData,
      hueShift: number,
    ): Promise<ImageData | null> => {
      setProcessing(true);
      try {
        if (processorRef.current) {
          const inputData = imageDataToUint8Array(imageData);
          const result = processorRef.current.adjust_hue(
            inputData,
            imageData.width,
            imageData.height,
            hueShift,
          );
          return uint8ArrayToImageData(
            result,
            imageData.width,
            imageData.height,
          );
        } else if (fallbackRef.current) {
          return fallbackRef.current.adjustHue(imageData, hueShift);
        }
        return null;
      } catch (err) {
        console.error("hue adjust error:", err);
        if (fallbackRef.current) {
          return fallbackRef.current.adjustHue(imageData, hueShift);
        }
        return null;
      } finally {
        setProcessing(false);
      }
    },
    [setProcessing],
  );

  const getHistogram = useCallback(
    async (imageData: ImageData): Promise<HistogramData | null> => {
      try {
        if (processorRef.current) {
          const inputData = imageDataToUint8Array(imageData);
          return processorRef.current.get_histogram(inputData);
        } else if (fallbackRef.current) {
          return fallbackRef.current.getHistogram(imageData);
        }
        return null;
      } catch (err) {
        console.error("histogram error:", err);
        if (fallbackRef.current) {
          return fallbackRef.current.getHistogram(imageData);
        }
        return null;
      }
    },
    [],
  );

  const getFilterTypes = useCallback(async (): Promise<string[]> => {
    return getAllFilterTypes();
  }, []);

  const getCategories = useCallback(async (): Promise<string[]> => {
    return getFilterCategories();
  }, []);

  const getFiltersForCategory = useCallback(
    async (category: string): Promise<string[]> => {
      return getFiltersByCategory(category);
    },
    [],
  );

  const getMetadata = useCallback(
    async (filterType: string): Promise<FilterMetadata | null> => {
      return getFilterMetadata(filterType);
    },
    [],
  );

  return {
    state,
    applyFilter,
    crop,
    resize,
    rotate,
    flip,
    adjustHue,
    getHistogram,
    getFilterTypes,
    getCategories,
    getFiltersForCategory,
    getMetadata,
  };
}
