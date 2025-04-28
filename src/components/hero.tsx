"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, ArrowRightIcon, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ny } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import Safari from "./ui/safari";
import AnimatedShinyText from "./ui/animated-shiny-text";
import { Navbar } from "./navbar";
import { authClient } from "~/lib/auth-client";
import { toast } from "sonner";
import { AuthDialog } from "./auth-dialog";

export function Hero() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const router = useRouter();

  const FEATURES = [
    "Professional templates",
    "Real-time collaboration",
    "Advanced design tools",
    "Cloud storage",
  ];

  const { data: session, isPending } = authClient.useSession();

  const handleStartCreateClick = () => {
    if (!session) {
      setAuthDialogOpen(true);
    } else {
      router.push("/templates");
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar onAuthDialogOpen={() => setAuthDialogOpen(true)} />
      <div className="relative isolate flex-1 overflow-hidden">
        <div
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-purple-500 to-indigo-500 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>

        <div className="mx-auto h-full max-w-7xl px-6 py-4 lg:flex lg:px-8">
          <div className="mx-auto flex max-w-2xl flex-shrink-0 flex-col justify-center bg-gridBg lg:mx-0 lg:max-w-xl lg:pt-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div
                className={ny(
                  "group w-56 rounded-full border border-black/5 bg-purple-50 text-base transition-all ease-in hover:cursor-pointer hover:bg-purple-50/50",
                )}
              >
                <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:duration-300">
                  <span className="text-purple-400">✨ Introducing Arture</span>
                  <ArrowRightIcon className="ml-1 size-3 text-purple-400 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                </AnimatedShinyText>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="mt-10 text-4xl font-bold tracking-tight text-foreground/90 sm:text-6xl">
                Create stunning designs with ease
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Unleash your creativity with our powerful design platform.
                Create beautiful graphics, illustrations, and layouts for any
                project - no design experience needed.
              </p>
            </motion.div>

            <motion.div
              className="mt-10 flex items-center gap-x-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button
                onClick={handleStartCreateClick}
                className="group relative inline-flex items-center gap-x-2 rounded-full bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
              >
                Start creating
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>

            <motion.div
              className="mt-10 grid grid-cols-2 gap-x-8 gap-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={feature}
                  className="flex items-center gap-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                >
                  <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-purple-100">
                    <svg
                      className="h-4 w-4 text-purple-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  </div>
                  <span className="text-sm leading-6 text-gray-600">
                    {feature}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div
            className="group relative mx-auto flex max-w-2xl items-center justify-center lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-24"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="absolute -inset-0.5 overflow-hidden rounded-xl opacity-0 transition duration-300 group-hover:opacity-20">
              <div
                className="absolute inset-0 animate-pulse bg-gradient-to-t from-orange-500/30 via-red-500/20 to-transparent"
                style={{
                  height: "30%",
                  bottom: 0,
                  backgroundSize: "100% 100%",
                  backgroundPosition: "center bottom",
                }}
              ></div>
            </div>

            <div className="relative rounded-xl border border-purple-500/20 bg-background/5 p-1 shadow-md backdrop-blur-sm transition-all duration-300 group-hover:border-orange-400/30">
              <div className="relative">
                <Safari
                  src="https://res.cloudinary.com/dkysrpdi6/image/upload/v1710317497/ijkte1lttxyzroiop3dq.jpg"
                  url="https://arture.vercel.app"
                  className="h-[25rem] w-[40rem] flex-none rounded-lg bg-transparent"
                />

                <div
                  className="absolute inset-0 flex cursor-pointer items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  onClick={() => console.log("hello")}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white">
                    <Play className="ml-1 h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <AuthDialog
        isOpen={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
      />
    </div>
  );
}
