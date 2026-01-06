import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

// cache for 30 minutes, keep unused data for 1 hour
const staleTime = 1000 * 60 * 30;
const gcTime = 1000 * 60 * 60;

export interface PixabayImage {
  id: string;
  url: string;
  thumbnail: string;
  preview: string;
  tags: string[];
  type: string;
  width: number;
  height: number;
  user: string;
  source: string;
}

interface PixabayResponse {
  success: boolean;
  data: {
    images: PixabayImage[];
    total: number;
    page: number;
    perPage?: number;
    rateLimited?: boolean;
    noApiKey?: boolean;
    message?: string;
  };
}

interface PixabayStatusResponse {
  success: boolean;
  data: {
    rateLimited: boolean;
    hasApiKey: boolean;
  };
}

// fetch pixabay images
async function fetchPixabayImages(params: {
  query: string;
  page?: number;
  imageType?: string;
}): Promise<{
  images: PixabayImage[];
  rateLimited?: boolean;
  noApiKey?: boolean;
}> {
  const searchParams = new URLSearchParams();
  searchParams.set("q", params.query);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.imageType) searchParams.set("image_type", params.imageType);

  const res = await fetch(`/api/pixabay/search?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch pixabay images");

  const json: PixabayResponse = await res.json();
  return {
    images: json.data?.images || [],
    rateLimited: json.data?.rateLimited,
    noApiKey: json.data?.noApiKey,
  };
}

// fetch popular images
async function fetchPopularImages(page: number = 1): Promise<PixabayImage[]> {
  const res = await fetch(`/api/pixabay/popular?page=${page}`);
  if (!res.ok) throw new Error("Failed to fetch popular images");

  const json: PixabayResponse = await res.json();
  return json.data?.images || [];
}

// fetch illustrations
async function fetchIllustrations(
  query: string = "",
  page: number = 1,
): Promise<PixabayImage[]> {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("page", String(page));

  const res = await fetch(`/api/pixabay/illustrations?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch illustrations");

  const json: PixabayResponse = await res.json();
  return json.data?.images || [];
}

// check pixabay status
export const usePixabayStatus = () =>
  useQuery({
    queryKey: ["pixabay-status"],
    queryFn: async () => {
      const res = await fetch("/api/pixabay/status");
      if (!res.ok) throw new Error("Failed to check pixabay status");
      const json: PixabayStatusResponse = await res.json();
      return json.data;
    },
    staleTime: 1000 * 30,
  });

// search images hook
export const usePixabaySearch = (query: string, imageType?: string) =>
  useQuery({
    queryKey: ["pixabay-search", query, imageType],
    queryFn: () => fetchPixabayImages({ query, imageType }),
    staleTime,
    gcTime,
    enabled: query.length >= 2,
  });

// popular images hook
export const usePixabayPopular = () =>
  useQuery({
    queryKey: ["pixabay-popular"],
    queryFn: () => fetchPopularImages(),
    staleTime,
    gcTime,
  });

// illustrations hook
export const usePixabayIllustrations = (query: string = "") =>
  useQuery({
    queryKey: ["pixabay-illustrations", query],
    queryFn: () => fetchIllustrations(query),
    staleTime,
    gcTime,
  });

// infinite query for search
export const useInfinitePixabaySearch = (
  query: string,
  imageType?: string,
  options?: { enabled?: boolean },
) =>
  useInfiniteQuery({
    queryKey: ["pixabay-search-infinite", query, imageType],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      params.set("q", query);
      params.set("page", String(pageParam));
      if (imageType) params.set("image_type", imageType);
      params.set("per_page", "20");

      const res = await fetch(`/api/pixabay/search?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch images");

      const json: PixabayResponse = await res.json();
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
    gcTime,
    enabled: options?.enabled !== false && query.length >= 2,
  });

// infinite query for illustrations
export const useInfinitePixabayIllustrations = (query: string = "") =>
  useInfiniteQuery({
    queryKey: ["pixabay-illustrations-infinite", query],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      params.set("page", String(pageParam));

      const res = await fetch(
        `/api/pixabay/illustrations?${params.toString()}`,
      );
      if (!res.ok) throw new Error("Failed to fetch illustrations");

      const json: PixabayResponse = await res.json();
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
      const totalPages = Math.ceil(lastPage.total / 30);
      if (lastPage.page < totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime,
    gcTime,
  });
