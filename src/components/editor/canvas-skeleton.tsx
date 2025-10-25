"use client";

export const CanvasSkeleton = () => {
  return (
    <div className="bg-muted/10 absolute inset-0 flex items-center justify-center">
      <div className="bg-background relative h-[500px] w-[500px] animate-pulse rounded-lg shadow-lg">
        {/* Top toolbar skeleton */}
        <div className="absolute top-4 left-1/2 flex -translate-x-1/2 gap-2">
          <div className="bg-muted h-8 w-24 rounded"></div>
          <div className="bg-muted h-8 w-24 rounded"></div>
          <div className="bg-muted h-8 w-24 rounded"></div>
        </div>

        {/* Canvas workspace skeleton */}
        <div className="absolute inset-0 m-8 flex items-center justify-center rounded bg-white shadow-md dark:bg-gray-100">
          <div className="space-y-4 text-center">
            {/* Placeholder shapes */}
            <div className="flex justify-center gap-3">
              <div className="bg-muted h-12 w-12 rounded-full"></div>
              <div className="bg-muted h-12 w-12 rounded"></div>
              <div className="bg-muted h-12 w-12 rounded-lg"></div>
            </div>

            {/* Text lines */}
            <div className="space-y-2">
              <div className="bg-muted mx-auto h-3 w-32 rounded"></div>
              <div className="bg-muted mx-auto h-3 w-24 rounded"></div>
            </div>
          </div>
        </div>

        {/* Side toolbar skeleton */}
        <div className="absolute top-1/2 right-4 -translate-y-1/2 space-y-2">
          <div className="bg-muted h-10 w-10 rounded"></div>
          <div className="bg-muted h-10 w-10 rounded"></div>
          <div className="bg-muted h-10 w-10 rounded"></div>
        </div>

        {/* Loading indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
            <span>Loading canvas...</span>
          </div>
        </div>
      </div>
    </div>
  );
};
