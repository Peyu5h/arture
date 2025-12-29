import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

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

export const useGetAssets = (params: {
  search?: string;
  type?: string;
  category?: string;
  limit?: number;
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
  });

export const useSearchAssets = (query: string) =>
  useQuery({
    queryKey: ["assets-search", query],
    queryFn: () => fetchAssets({ search: query, limit: 50 }),
    staleTime,
    enabled: !!query,
  });
