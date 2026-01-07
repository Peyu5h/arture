import { useState, useCallback, useRef, useEffect } from "react";

interface BackgroundRemovalState {
  isProcessing: boolean;
  progress: number;
  error: string | null;
}

interface UseBackgroundRemovalReturn extends BackgroundRemovalState {
  removeBackground: (imageSource: string | Blob | File) => Promise<Blob | null>;
  reset: () => void;
}

export const useBackgroundRemoval = (): UseBackgroundRemovalReturn => {
  const [state, setState] = useState<BackgroundRemovalState>({
    isProcessing: false,
    progress: 0,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setState({ isProcessing: false, progress: 0, error: null });
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const removeBackground = useCallback(
    async (imageSource: string | Blob | File): Promise<Blob | null> => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();

      setState({ isProcessing: true, progress: 0, error: null });
      startTimeRef.current = Date.now();

      // smooth progress using requestAnimationFrame
      let currentProgress = 0;
      let isComplete = false;

      const animateProgress = () => {
        if (isComplete) return;

        const elapsed = Date.now() - startTimeRef.current;
        // ease out to 90% over ~10 seconds
        const targetProgress = Math.min(90, (elapsed / 10000) * 100);
        currentProgress += (targetProgress - currentProgress) * 0.1;
        currentProgress = Math.min(90, currentProgress);

        setState((prev) => ({
          ...prev,
          progress: Math.round(currentProgress),
        }));

        rafRef.current = requestAnimationFrame(animateProgress);
      };

      rafRef.current = requestAnimationFrame(animateProgress);

      try {
        const { removeBackground: imglyRemoveBackground } =
          await import("@imgly/background-removal");

        const result = await imglyRemoveBackground(imageSource, {
          debug: false,
          device: "gpu",
          model: "isnet_fp16",
          output: {
            format: "image/png",
            quality: 0.9,
          },
        });

        // mark complete and animate to 100%
        isComplete = true;
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }

        // quick finish animation
        const finishProgress = async () => {
          for (let p = Math.round(currentProgress); p <= 100; p += 4) {
            setState((prev) => ({ ...prev, progress: Math.min(100, p) }));
            await new Promise((r) => setTimeout(r, 16));
          }
          setState({ isProcessing: false, progress: 100, error: null });
        };

        await finishProgress();
        return result;
      } catch (err) {
        isComplete = true;
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }

        const errorMessage =
          err instanceof Error ? err.message : "Failed to remove background";
        setState({ isProcessing: false, progress: 0, error: errorMessage });
        console.error("Background removal failed:", err);
        return null;
      }
    },
    [],
  );

  return {
    ...state,
    removeBackground,
    reset,
  };
};
