import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

const staleTime = 1000 * 60 * 5;

export interface PexelsImage {
  id: string;
  url: string;
  thumbnail: string;
  preview: string;
  width: number;
  height: number;
  photographer: string;
  avgColor: string;
  alt: string;
  source: string;
}

interface PexelsResponse {
  success: boolean;
  data: {
    images: PexelsImage[];
    total: number;
    page: number;
    perPage?: number;
    rateLimited?: boolean;
    noApiKey?: boolean;
    message?: string;
  };
}

interface PexelsStatusResponse {
  success: boolean;
  data: {
    rateLimited: boolean;
    hasApiKey: boolean;
    remainingRequests: number | null;
  };
}

// check pexels status
export const usePexelsStatus = () =>
  useQuery({
    queryKey: ["pexels-status"],
    queryFn: async () => {
      const res = await fetch("/api/pexels/status");
      if (!res.ok) throw new Error("Failed to check pexels status");
      const json: PexelsStatusResponse = await res.json();
      return json.data;
    },
    staleTime: 1000 * 30,
  });

// search pexels images
export const usePexelsSearch = (
  query: string,
  orientation?: string,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["pexels-search", query, orientation],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("q", query);
      if (orientation) params.set("orientation", orientation);

      const res = await fetch(`/api/pexels/search?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch pexels images");

      const json: PexelsResponse = await res.json();
      return {
        images: json.data?.images || [],
        rateLimited: json.data?.rateLimited,
        noApiKey: json.data?.noApiKey,
      };
    },
    staleTime,
    enabled: options?.enabled !== false && query.length >= 2,
  });

// get curated images
export const usePexelsCurated = () =>
  useQuery({
    queryKey: ["pexels-curated"],
    queryFn: async () => {
      const res = await fetch("/api/pexels/curated");
      if (!res.ok) throw new Error("Failed to fetch curated images");

      const json: PexelsResponse = await res.json();
      return json.data?.images || [];
    },
    staleTime,
  });

// infinite search for backgrounds
export const useInfinitePexelsSearch = (
  query: string,
  orientation?: string,
  options?: { enabled?: boolean },
) =>
  useInfiniteQuery({
    queryKey: ["pexels-search-infinite", query, orientation],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      params.set("q", query);
      params.set("page", String(pageParam));
      params.set("per_page", "20");
      if (orientation) params.set("orientation", orientation);

      const res = await fetch(`/api/pexels/search?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch images");

      const json: PexelsResponse = await res.json();
      return {
        images: json.data?.images || [],
        total: json.data?.total || 0,
        page: pageParam,
        rateLimited: json.data?.rateLimited || false,
        noApiKey: json.data?.noApiKey || false,
        message: json.data?.message,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.rateLimited || lastPage.noApiKey) return undefined;
      const totalPages = Math.ceil(lastPage.total / 20);
      if (lastPage.page < totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime,
    enabled: options?.enabled !== false && query.length >= 2,
  });

// infinite curated
export const useInfinitePexelsCurated = () =>
  useInfiniteQuery({
    queryKey: ["pexels-curated-infinite"],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      params.set("page", String(pageParam));
      params.set("per_page", "20");

      const res = await fetch(`/api/pexels/curated?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch curated images");

      const json: PexelsResponse = await res.json();
      return {
        images: json.data?.images || [],
        total: json.data?.total || 0,
        page: pageParam,
        rateLimited: json.data?.rateLimited || false,
        noApiKey: json.data?.noApiKey || false,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.rateLimited || lastPage.noApiKey) return undefined;
      const totalPages = Math.ceil(lastPage.total / 20);
      if (lastPage.page < totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime,
  });
