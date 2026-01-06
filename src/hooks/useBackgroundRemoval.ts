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
  const animationFrameRef = useRef<number | null>(null);
  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);

  // smooth progress animation
  const animateProgress = useCallback(() => {
    const target = targetProgressRef.current;
    const current = currentProgressRef.current;

    if (Math.abs(target - current) < 0.5) {
      currentProgressRef.current = target;
      setState((prev) => ({ ...prev, progress: Math.round(target) }));
      return;
    }

    // ease towards target
    const diff = target - current;
    const step = diff * 0.15;
    currentProgressRef.current = current + step;

    setState((prev) => ({
      ...prev,
      progress: Math.round(currentProgressRef.current),
    }));

    animationFrameRef.current = requestAnimationFrame(animateProgress);
  }, []);

  const startProgressAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animateProgress);
  }, [animateProgress]);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    targetProgressRef.current = 0;
    currentProgressRef.current = 0;
    setState({ isProcessing: false, progress: 0, error: null });
  }, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const removeBackground = useCallback(
    async (imageSource: string | Blob | File): Promise<Blob | null> => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();

      // reset progress
      targetProgressRef.current = 0;
      currentProgressRef.current = 0;
      setState({ isProcessing: true, progress: 0, error: null });

      // start with initial progress animation
      targetProgressRef.current = 5;
      startProgressAnimation();

      try {
        const { removeBackground: imglyRemoveBackground } = await import(
          "@imgly/background-removal"
        );

        // loading the model
        targetProgressRef.current = 15;

        const result = await imglyRemoveBackground(imageSource, {
          debug: false,
          device: "gpu",
          model: "isnet_fp16",
          output: {
            format: "image/png",
            quality: 0.9,
          },
          progress: (key: string, current: number, total: number) => {
            // map progress from the library (0-1 range per stage)
            const stageProgress = (current / total) * 100;

            // different stages contribute different amounts
            if (key.includes("fetch") || key.includes("load")) {
              // model loading: 15-35%
              targetProgressRef.current = 15 + stageProgress * 0.2;
            } else if (key.includes("inference") || key.includes("process")) {
              // inference: 35-95%
              targetProgressRef.current = 35 + stageProgress * 0.6;
            } else {
              // other stages
              targetProgressRef.current = Math.min(
                95,
                targetProgressRef.current + stageProgress * 0.1,
              );
            }
          },
        });

        // complete
        targetProgressRef.current = 100;

        // wait a bit for animation to catch up
        await new Promise((resolve) => setTimeout(resolve, 200));

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        setState({ isProcessing: false, progress: 100, error: null });
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to remove background";

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        targetProgressRef.current = 0;
        currentProgressRef.current = 0;
        setState({ isProcessing: false, progress: 0, error: errorMessage });
        console.error("Background removal failed:", err);
        return null;
      }
    },
    [startProgressAnimation],
  );

  return {
    ...state,
    removeBackground,
    reset,
  };
};
