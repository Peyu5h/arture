"use client";

import { Skeleton } from "../ui/skeleton";

export const CanvasSkeleton = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative">
        <Skeleton className="h-[500px] w-[500px] rounded-lg shadow-lg" />
      </div>
    </div>
  );
};

// full editor page skeleton with all panels
export const EditorSkeleton = () => {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      {/* navbar skeleton */}
      <div className="bg-background flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-6 w-24 rounded" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16 rounded" />
            <Skeleton className="h-8 w-16 rounded" />
            <Skeleton className="h-8 w-16 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20 rounded" />
          <Skeleton className="h-9 w-24 rounded" />
        </div>
      </div>

      <div className="relative flex w-full flex-1 overflow-hidden">
        {/* left sidebar skeleton */}
        <div className="bg-background flex w-[72px] flex-col items-center gap-1 border-r py-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 p-2">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-2 w-8 rounded" />
            </div>
          ))}
        </div>

        {/* main canvas area */}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* canvas container with checkerboard bg */}
          <div className="canvas-container absolute inset-0">
            <div className="flex h-full w-full items-center justify-center">
              {/* canvas placeholder */}
              <div className="relative">
                <Skeleton className="h-[500px] w-[500px] rounded-lg shadow-xl" />
              </div>
            </div>

            {/* zoom controls skeleton */}
            <div className="absolute right-4 bottom-4 z-10">
              <div className="bg-background/80 flex items-center gap-1 rounded-lg border p-1 shadow-lg backdrop-blur-sm">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="mx-2 h-4 w-12 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <div className="bg-border mx-1 h-6 w-px" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </div>

          {/* toolbar skeleton */}
          <div className="bg-background pointer-events-none absolute top-0 right-0 left-0 z-10 flex h-14 items-center justify-center border-b opacity-0">
            <div className="flex items-center gap-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-8 rounded" />
              ))}
            </div>
          </div>
        </main>

        {/* right panel skeleton (ai assistant) */}
        <div className="bg-background flex w-[320px] flex-col border-l">
          <div className="flex h-14 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-24 rounded" />
            </div>
            <Skeleton className="h-6 w-6 rounded" />
          </div>

          <div className="flex-1 p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-2 w-2 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t p-4">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-28 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-26 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
