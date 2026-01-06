import { useInfiniteQuery } from "@tanstack/react-query";
import { getRandomPhotos, getPhotosByQuery } from "~/lib/unsplash";
import { UnsplashImage } from "~/lib/types";

const staleTime = 1000 * 60 * 5;

interface SearchResult {
  results: UnsplashImage[];
  totalPages: number;
  total: number;
}

// infinite random photos hook
export const useInfiniteRandomPhotos = ({ count = 20 }: { count?: number }) =>
  useInfiniteQuery({
    queryKey: ["unsplash-random", count],
    queryFn: async ({ pageParam = 1 }) => {
      const photos = await getRandomPhotos({ count, page: pageParam });
      return photos;
    },
    initialPageParam: 1,
    getNextPageParam: (
      lastPage: UnsplashImage[],
      allPages: UnsplashImage[][],
    ) => {
      if (lastPage.length < count) return undefined;
      return allPages.length + 1;
    },
    staleTime,
  });

// infinite search photos hook
export const useInfinitePhotosByQuery = ({
  query,
  perPage = 18,
}: {
  query: string;
  perPage?: number;
}) =>
  useInfiniteQuery({
    queryKey: ["unsplash-search", query, perPage],
    queryFn: async ({ pageParam = 1 }) => {
      if (!query || query.length < 2) {
        return { results: [], totalPages: 0, total: 0 };
      }
      const data = await getPhotosByQuery({ query, page: pageParam, perPage });
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: SearchResult, allPages: SearchResult[]) => {
      if (!lastPage.totalPages || allPages.length >= lastPage.totalPages) {
        return undefined;
      }
      return allPages.length + 1;
    },
    staleTime,
    enabled: query.length >= 2,
  });
