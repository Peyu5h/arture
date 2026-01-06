import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";

interface BgRemovalOverlayProps {
  isVisible: boolean;
  progress: number;
  targetBounds?: {
    left: number;
    top: number;
    width: number;
    height: number;
  } | null;
}

export const BgRemovalOverlay = ({
  isVisible,
  progress,
  targetBounds,
}: BgRemovalOverlayProps) => {
  if (!isVisible || !targetBounds) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute z-50"
          style={{
            left: targetBounds.left,
            top: targetBounds.top,
            width: targetBounds.width,
            height: targetBounds.height,
          }}
        >
          <div className="relative size-full overflow-hidden rounded-lg">
            {/* glassmorphic overlay */}
            <motion.div
              className="absolute inset-0 backdrop-blur-sm"
              style={{
                background:
                  "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />

            {/* animated gradient sweep */}
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, transparent 30%, rgba(139, 92, 246, 0.4) 50%, rgba(59, 130, 246, 0.4) 70%, transparent 100%)",
                backgroundSize: "200% 200%",
              }}
              animate={{
                backgroundPosition: ["-100% -100%", "200% 200%"],
              }}
              transition={{
                duration: 2,
                ease: "linear",
                repeat: Infinity,
              }}
            />

            {/* shimmer effect */}
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)",
                backgroundSize: "50% 100%",
              }}
              animate={{
                backgroundPosition: ["-50% 0%", "150% 0%"],
              }}
              transition={{
                duration: 1.5,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />

            {/* border glow */}
            <motion.div
              className="absolute inset-0 rounded-lg"
              style={{
                boxShadow:
                  "inset 0 0 30px rgba(139, 92, 246, 0.3), 0 0 30px rgba(139, 92, 246, 0.2)",
              }}
              animate={{
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 2,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            />

            {/* corner accents */}
            {[
              { top: 0, left: 0, rotate: 0 },
              { top: 0, right: 0, rotate: 90 },
              { bottom: 0, right: 0, rotate: 180 },
              { bottom: 0, left: 0, rotate: 270 },
            ].map((pos, i) => (
              <motion.div
                key={i}
                className="bg-primary absolute size-6"
                style={{
                  ...pos,
                  clipPath: "polygon(0 0, 100% 0, 0 100%)",
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0.6, 1, 0.6], scale: [0.8, 1, 0.8] }}
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}

            {/* center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <motion.div
                className="bg-background/80 border-primary/20 flex flex-col items-center gap-3 rounded-2xl border px-6 py-4 shadow-2xl backdrop-blur-md"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {/* icon */}
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 3,
                      ease: "linear",
                      repeat: Infinity,
                    }}
                  >
                    <Sparkles className="text-primary size-8" />
                  </motion.div>
                  <motion.div
                    className="bg-primary/20 absolute inset-0 -z-10 rounded-full blur-xl"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      ease: "easeInOut",
                      repeat: Infinity,
                    }}
                  />
                </div>

                {/* text */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-semibold">
                    AI Background Removal
                  </span>
                  <div className="flex items-center gap-2">
                    <Loader2 className="text-muted-foreground size-3 animate-spin" />
                    <span className="text-muted-foreground text-xs">
                      Processing...
                    </span>
                  </div>
                </div>

                {/* progress bar */}
                <div className="w-48">
                  <div className="bg-muted relative h-2 w-full overflow-hidden rounded-full">
                    <motion.div
                      className="bg-primary absolute inset-y-0 left-0 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-white/30"
                      style={{ width: `${progress}%` }}
                      animate={{
                        opacity: [0, 1, 0],
                        x: ["-100%", "100%"],
                      }}
                      transition={{
                        duration: 1.5,
                        ease: "linear",
                        repeat: Infinity,
                      }}
                    />
                  </div>

                  {/* percentage */}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-muted-foreground text-[10px] font-medium tracking-wider uppercase">
                      Progress
                    </span>
                    <motion.span
                      key={progress}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-primary text-xs font-bold tabular-nums"
                    >
                      {progress}%
                    </motion.span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
