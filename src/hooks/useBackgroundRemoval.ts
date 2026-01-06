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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCompleteRef = useRef<boolean>(false);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isCompleteRef.current = false;
    setState({ isProcessing: false, progress: 0, error: null });
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const removeBackground = useCallback(
    async (imageSource: string | Blob | File): Promise<Blob | null> => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();
      isCompleteRef.current = false;

      // reset progress
      setState({ isProcessing: true, progress: 0, error: null });

      // smooth progress simulation - increments steadily until complete
      let currentProgress = 0;
      const targetDuration = 8000; // estimated 8 seconds for processing
      const updateInterval = 50; // update every 50ms
      const maxProgress = 92; // cap at 92% until actually complete

      intervalRef.current = setInterval(() => {
        if (isCompleteRef.current) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        // easing function for smooth progress
        const remainingProgress = maxProgress - currentProgress;
        const increment = Math.max(0.3, remainingProgress * 0.02);
        currentProgress = Math.min(maxProgress, currentProgress + increment);

        setState((prev) => ({
          ...prev,
          progress: Math.round(currentProgress),
        }));
      }, updateInterval);

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

        // mark as complete and animate to 100%
        isCompleteRef.current = true;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        // smooth finish animation
        const finishAnimation = async () => {
          for (let p = Math.round(currentProgress); p <= 100; p += 2) {
            setState((prev) => ({ ...prev, progress: p }));
            await new Promise((r) => setTimeout(r, 20));
          }
          setState({ isProcessing: false, progress: 100, error: null });
        };

        await finishAnimation();
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to remove background";

        isCompleteRef.current = true;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

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
