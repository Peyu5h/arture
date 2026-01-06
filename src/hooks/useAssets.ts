import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";

const staleTime = 1000 * 60 * 5;

export interface Asset {
  id: string;
  name: string;
  type: string;
  category: string;
  tags: string[];
  theme: string[];
  color?: string;
  size: { width: number; height: number; aspectRatio: number };
  url: string;
  thumbnail: string;
  metadata: any;
  usageCount: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AssetsResponse {
  success: boolean;
  data: {
    assets: Asset[];
    total: number;
    page: number;
    limit: number;
  };
}

interface SimilarWordsResponse {
  success: boolean;
  data: {
    words: string[];
    query: string;
  };
}

// fetch assets from api
async function fetchAssets(params: {
  search?: string;
  type?: string;
  category?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}): Promise<Asset[]> {
  const searchParams = new URLSearchParams();

  if (params.search) searchParams.set("search", params.search);
  if (params.type) searchParams.set("type", params.type);
  if (params.category) searchParams.set("category", params.category);
  if (params.tags?.length) searchParams.set("tags", params.tags.join(","));
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const res = await fetch(`/api/assets?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch assets");

  const json: AssetsResponse = await res.json();
  return json.data?.assets || [];
}

// fuzzy search with typo tolerance
async function fetchFuzzyAssets(params: {
  query: string;
  type?: string;
  limit?: number;
}): Promise<Asset[]> {
  const searchParams = new URLSearchParams();
  searchParams.set("q", params.query);
  if (params.type) searchParams.set("type", params.type);
  if (params.limit) searchParams.set("limit", String(params.limit));

  const res = await fetch(
    `/api/assets/fuzzy-search?${searchParams.toString()}`,
  );
  if (!res.ok) throw new Error("Failed to fetch fuzzy assets");

  const json: AssetsResponse = await res.json();
  return json.data?.assets || [];
}

// get similar words from gemini
async function fetchSimilarWords(query: string): Promise<string[]> {
  const res = await fetch("/api/assets/suggest-words", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) return [];

  const json: SimilarWordsResponse = await res.json();
  return json.data?.words || [];
}

export const useGetAssets = (params: {
  search?: string;
  type?: string;
  category?: string;
  limit?: number;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: ["assets", params],
    queryFn: () =>
      fetchAssets({
        ...params,
        type: params.type || "DECORATION",
        limit: params.limit || 30,
      }),
    staleTime,
    enabled: params.enabled !== false,
  });

export const useSearchAssets = (query: string) =>
  useQuery({
    queryKey: ["assets-search", query],
    queryFn: () => fetchAssets({ search: query, limit: 50 }),
    staleTime,
    enabled: !!query,
  });

// fuzzy search hook
export const useFuzzySearch = (query: string, type?: string) =>
  useQuery({
    queryKey: ["assets-fuzzy", query, type],
    queryFn: () => fetchFuzzyAssets({ query, type, limit: 50 }),
    staleTime,
    enabled: query.length >= 2,
  });

// similar words hook
export const useSimilarWords = (query: string) =>
  useQuery({
    queryKey: ["similar-words", query],
    queryFn: () => fetchSimilarWords(query),
    staleTime: 1000 * 60 * 10,
    enabled: query.length >= 2,
    retry: false,
  });

// enhanced search hook with parallel ai suggestions
export const useEnhancedSearch = (
  query: string,
  type: string = "DECORATION",
) => {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // main fuzzy search
  const {
    data: fuzzyResults,
    isLoading: isFuzzyLoading,
    error: fuzzyError,
  } = useFuzzySearch(query, type);

  // ai suggestions (background)
  const fetchAiSuggestions = useCallback(async () => {
    if (query.length < 2) return;

    // cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setIsAiLoading(true);

    try {
      // get similar words from gemini
      const words = await fetchSimilarWords(query);
      if (!words.length) {
        setIsAiLoading(false);
        return;
      }

      // fetch assets for each word in parallel
      const wordResults = await Promise.all(
        words.map((word) =>
          fetchFuzzyAssets({ query: word, type, limit: 10 }).catch(() => []),
        ),
      );

      // flatten and dedupe
      const existingIds = new Set(fuzzyResults?.map((a) => a.id) || []);
      const newAssets = wordResults
        .flat()
        .filter((asset) => !existingIds.has(asset.id));

      // dedupe within new assets
      const uniqueNew = Array.from(
        new Map(newAssets.map((a) => [a.id, a])).values(),
      );

      setAllAssets((prev) => {
        const currentIds = new Set(prev.map((a) => a.id));
        const toAdd = uniqueNew.filter((a) => !currentIds.has(a.id));
        return [...prev, ...toAdd];
      });
    } catch (err) {
      // silently fail ai suggestions
      console.warn("AI suggestions failed:", err);
    } finally {
      setIsAiLoading(false);
    }
  }, [query, type, fuzzyResults]);

  // update base results when fuzzy search completes
  useEffect(() => {
    if (fuzzyResults) {
      setAllAssets(fuzzyResults);
    }
  }, [fuzzyResults]);

  // trigger ai suggestions after fuzzy results
  useEffect(() => {
    if (fuzzyResults && query.length >= 2) {
      const timer = setTimeout(fetchAiSuggestions, 200);
      return () => clearTimeout(timer);
    }
  }, [fuzzyResults, query, fetchAiSuggestions]);

  // reset on query change
  useEffect(() => {
    setAllAssets([]);
  }, [query]);

  return {
    assets: allAssets,
    isLoading: isFuzzyLoading,
    isAiLoading,
    error: fuzzyError,
  };
};
