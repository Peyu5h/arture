"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Pen, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { ny } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import Safari from "./ui/safari";
import { Navbar } from "./navbar";
import { authClient } from "~/lib/auth-client";
import { AuthDialog } from "./auth-dialog";
import { useCreateProject } from "~/hooks/useCreateProject";
import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH } from "~/lib/constants";
import { BorderBeam } from "./ui/border-beam";
import { RainbowButton } from "./ui/rainbow-button";
import { Particles } from "./ui/particles";

export function Hero() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const createProjectMutation = useCreateProject();

  const handleStartCreateClick = async () => {
    if (!session) {
      setAuthDialogOpen(true);
    } else {
      try {
        const newProject = await createProjectMutation.mutateAsync({
          name: "Untitled Project",
          json: {},
          width: DEFAULT_CANVAS_WIDTH,
          height: DEFAULT_CANVAS_HEIGHT,
        });
        router.push(`/editor/${newProject.id}`);
      } catch (error) {
        console.error("Failed to create project from Hero:", error);
      }
    }
  };

  return (
    <div className="bg-background flex min-h-screen flex-col overflow-hidden">
      <Navbar onAuthDialogOpen={() => setAuthDialogOpen(true)} />

      {/* Hero Section */}
      <section className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-12 sm:px-6 sm:pt-32 sm:pb-20">
        {/* Animated background gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="bg-gradient-radial from-primary/30 via-primary/10 absolute top-0 -left-40 h-[600px] w-[600px] animate-pulse rounded-full to-transparent blur-[80px] sm:-left-60 sm:h-[1000px] sm:w-[1000px] sm:blur-[100px]"
            style={{ animationDuration: "4s" }}
          />
          <div
            className="bg-gradient-radial from-accent/25 via-accent/8 absolute top-20 -right-20 h-[550px] w-[550px] animate-pulse rounded-full to-transparent blur-[70px] sm:-right-40 sm:h-[900px] sm:w-[900px] sm:blur-[90px]"
            style={{ animationDelay: "1.5s", animationDuration: "5s" }}
          />
          <div
            className="bg-gradient-radial from-primary/20 absolute top-1/3 left-1/2 h-[500px] w-[500px] -translate-x-1/2 animate-pulse rounded-full via-transparent to-transparent blur-[90px] sm:h-[800px] sm:w-[800px] sm:blur-[120px]"
            style={{ animationDelay: "3s", animationDuration: "6s" }}
          />
        </div>

        {/* Noise texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-[1000px] space-y-6 text-center sm:space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex"
          >
            <div className="group border-primary/30 bg-primary/5 hover:bg-primary/10 inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-sm transition-all duration-300 sm:px-4 sm:py-2">
              <Sparkles className="text-primary h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-foreground text-[11px] font-medium sm:text-xs">
                Introducing Arture
              </span>
              <ArrowRight className="text-primary h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
            </div>
          </motion.div>

          {/* Main Heading with Comet Effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="text-foreground text-[2.5rem] leading-[1.05] font-light tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl xl:text-[6.5rem]">
              <span className="inline-block">
                <span className="relative inline-block">
                  <span className="relative z-10">Create</span>
                  <span className="from-primary/20 via-accent/20 absolute inset-0 bg-gradient-to-r to-transparent blur-xl" />
                </span>
              </span>{" "}
              <span className="from-foreground via-foreground/90 to-foreground/70 inline-block bg-gradient-to-br bg-clip-text pb-2 text-transparent">
                stunning
              </span>
              <br />
              <span className="relative inline-block">
                <span className="from-foreground to-foreground/80 relative z-10 bg-gradient-to-r bg-clip-text text-transparent">
                  designs
                </span>
                <motion.span
                  className="from-primary/30 via-accent/30 absolute -inset-1 bg-gradient-to-r to-transparent blur-2xl"
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </span>{" "}
              <span className="inline-block">with ease</span>
            </h1>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-muted-foreground mx-auto max-w-3xl px-2 text-base leading-relaxed sm:px-0 sm:text-lg md:text-xl"
          >
            Unleash your creativity with our powerful AI design platform. Create
            beautiful graphics, illustrations, and layouts for any project - no
            design experience.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative z-50 flex flex-col items-center justify-center gap-3 pt-4 sm:flex-row sm:gap-4 sm:pt-6"
          >
            <Button
              onClick={handleStartCreateClick}
              disabled={createProjectMutation.isPending}
              size={"lg"}
              effect="shineHover"
              className="dark:bg-primary/50 bg-primary hover:bg-primary/90 dark:hover:bg-primary/60 relative w-full sm:w-auto"
            >
              {createProjectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>Create a project</>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-border/50 dark:hover:border-accent/50 group relative h-12 w-full rounded-lg border bg-slate-200/30 px-8 backdrop-blur-sm hover:bg-slate-200/40 sm:w-auto dark:bg-slate-900/30 dark:hover:bg-slate-900/40"
            >
              Inspire me
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>

          {/* Trust Badge */}
        </div>

        {/* App Preview Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.4 }}
          className="relative z-0 mx-auto mt-12 w-full max-w-[1400px] px-4 sm:mt-20 sm:px-6"
        >
          <div className="group relative">
            {/* Intense primary glow effect - Only at the top */}
            <motion.div
              className="bg-primary pointer-events-none absolute -top-[60px] left-1/2 h-[120px] w-[400px] -translate-x-1/2 rounded-full blur-[80px] sm:-top-[120px] sm:h-[200px] sm:w-[800px] sm:blur-[120px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{
                duration: 2,
                delay: 1,
                ease: "easeOut",
              }}
            />

            {/* Secondary bright glow layer - Top only */}
            <motion.div
              className="bg-primary/80 pointer-events-none absolute -top-[50px] left-1/2 h-[100px] w-[350px] -translate-x-1/2 rounded-full blur-[70px] sm:-top-[100px] sm:h-[180px] sm:w-[700px] sm:blur-[100px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{
                duration: 2.5,
                delay: 1.2,
                ease: "easeOut",
              }}
            />

            {/* Accent glow for color variation - Top only */}
            <motion.div
              className="bg-accent/60 pointer-events-none absolute -top-[40px] left-1/2 h-[80px] w-[300px] -translate-x-1/2 rounded-full blur-[60px] sm:-top-[80px] sm:h-[160px] sm:w-[600px] sm:blur-[90px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              transition={{
                duration: 3,
                delay: 1.5,
                ease: "easeOut",
              }}
            />
            {/* Animated particles */}
            <div className="relative top-0 mt-[-50px] h-[50px] w-full overflow-hidden sm:mt-[-100px] sm:h-[100px]">
              <Particles />
            </div>

            {/* Glass container */}
            <div className="relative z-10 overflow-visible rounded-xl shadow-2xl backdrop-blur-xl sm:rounded-2xl">
              <div className="from-primary/5 to-accent/5 absolute inset-0 bg-gradient-to-br via-transparent" />

              <div className="relative overflow-hidden rounded-xl sm:rounded-2xl">
                <Safari
                  src="https://res.cloudinary.com/dkysrpdi6/image/upload/v1761405968/Screenshot_2025-10-25_205039_to7bgk.png"
                  url="https://arture.vercel.app"
                  className="h-auto w-full rounded-lg bg-transparent"
                />
                <BorderBeam duration={24} size={100} delay={2} />

                {/* Strong bottom fade to background - Creates seamless blend */}
                <div className="from-background via-background pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent" />

                {/* Even stronger fade at the very bottom */}
                <div className="from-background via-background/95 pointer-events-none absolute inset-x-0 -bottom-1 h-32 bg-gradient-to-t to-transparent" />
              </div>
            </div>
          </div>

          {/* Extended bottom fade outside container */}
          <div className="from-background via-background/90 pointer-events-none absolute inset-x-0 -bottom-12 h-24 bg-gradient-to-t to-transparent sm:-bottom-20 sm:h-40" />
        </motion.div>
      </section>

      <AuthDialog
        isOpen={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
      />
    </div>
  );
}
