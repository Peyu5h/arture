// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { api } from "~/lib/api";
// import { Asset, AssetType } from "@prisma/client";

// export interface AssetFilters {
//   type?: AssetType;
//   category?: string;
//   tags?: string[];
//   theme?: string[];
//   color?: string;
//   search?: string;
// }

// export interface SearchParams {
//   query: string;
//   filters?: AssetFilters;
// }

// export interface AssetWithScore extends Asset {
//   score?: number;
// }

// // Get all assets
// export const useAssets = (filters?: AssetFilters) => {
//   return useQuery({
//     queryKey: ["assets", filters],
//     queryFn: async () => {
//       const params = new URLSearchParams();
//       if (filters?.search) params.append("search", filters.search);
//       if (filters?.type) params.append("type", filters.type);
//       if (filters?.category) params.append("category", filters.category);
//       if (filters?.tags) params.append("tags", filters.tags.join(","));
//       if (filters?.theme) params.append("theme", filters.theme.join(","));
//       if (filters?.color) params.append("color", filters.color);

//       const response = await api.get(`/api/assets?${params.toString()}`);
//       return response.data.data;
//     },
//   });
// };

// // Search assets with AI
// export const useSearchAssets = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (params: SearchParams) => {
//       const response = await api.post("/api/assets/search", params);
//       return response.data.data;
//     },
//     onSuccess: (data) => {
//       // Cache the search results
//       queryClient.setQueryData(["assets", "search"], data);
//     },
//   });
// };

// // Get popular assets
// export const usePopularAssets = (limit: number = 20) => {
//   return useQuery({
//     queryKey: ["assets", "popular", limit],
//     queryFn: async () => {
//       const response = await api.get(`/api/assets/popular?limit=${limit}`);
//       return response.data.data.assets;
//     },
//   });
// };

// // Get assets by category
// export const useAssetsByCategory = (category: string) => {
//   return useQuery({
//     queryKey: ["assets", "category", category],
//     queryFn: async () => {
//       const response = await api.get(`/api/assets/category/${category}`);
//       return response.data.data.assets;
//     },
//     enabled: !!category,
//   });
// };

// // Get assets by type
// export const useAssetsByType = (type: AssetType) => {
//   return useQuery({
//     queryKey: ["assets", "type", type],
//     queryFn: async () => {
//       const response = await api.get(`/api/assets/type/${type}`);
//       return response.data.data.assets;
//     },
//     enabled: !!type,
//   });
// };

// // Get single asset
// export const useAsset = (id: string) => {
//   return useQuery({
//     queryKey: ["assets", id],
//     queryFn: async () => {
//       const response = await api.get(`/api/assets/${id}`);
//       return response.data.data.asset;
//     },
//     enabled: !!id,
//   });
// };

// // Upload asset
// export const useUploadAsset = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (formData: FormData) => {
//       const response = await api.post("/api/assets/upload", formData);
//       return response.data.data;
//     },
//     onSuccess: () => {
//       // Invalidate all asset queries
//       queryClient.invalidateQueries({ queryKey: ["assets"] });
//     },
//   });
// };

// // Delete asset
// export const useDeleteAsset = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (assetId: string) => {
//       const response = await api.delete(`/api/assets/${assetId}`);
//       return response.data;
//     },
//     onSuccess: () => {
//       // Invalidate all asset queries
//       queryClient.invalidateQueries({ queryKey: ["assets"] });
//     },
//   });
// };

// // Update asset
// export const useUpdateAsset = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async ({ id, data }: { id: string; data: Partial<Asset> }) => {
//       const response = await api.put(`/api/assets/${id}`, data);
//       return response.data.data.asset;
//     },
//     onSuccess: (updatedAsset) => {
//       // Update the specific asset in cache
//       queryClient.setQueryData(["assets", updatedAsset.id], updatedAsset);
//       // Invalidate related queries
//       queryClient.invalidateQueries({ queryKey: ["assets"] });
//     },
//   });
// };

// // Add asset to project
// export const useAddAssetToProject = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async ({
//       projectId,
//       assetId,
//       usageData,
//     }: {
//       projectId: string;
//       assetId: string;
//       usageData: any;
//     }) => {
//       const response = await api.post(`/api/projects/${projectId}/assets`, {
//         assetId,
//         usageData,
//       });
//       return response.data;
//     },
//     onSuccess: () => {
//       // Invalidate project queries
//       queryClient.invalidateQueries({ queryKey: ["projects"] });
//     },
//   });
// };

// // Get project assets
// export const useProjectAssets = (projectId: string) => {
//   return useQuery({
//     queryKey: ["projects", projectId, "assets"],
//     queryFn: async () => {
//       const response = await api.get(`/api/projects/${projectId}/assets`);
//       return response.data.data.assets;
//     },
//     enabled: !!projectId,
//   });
// };

// // Remove asset from project
// export const useRemoveAssetFromProject = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async ({
//       projectId,
//       assetId,
//     }: {
//       projectId: string;
//       assetId: string;
//     }) => {
//       const response = await api.delete(
//         `/api/projects/${projectId}/assets/${assetId}`,
//       );
//       return response.data;
//     },
//     onSuccess: () => {
//       // Invalidate project queries
//       queryClient.invalidateQueries({ queryKey: ["projects"] });
//     },
//   });
// };
