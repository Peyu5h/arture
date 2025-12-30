import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getPhotosByQuery, getRandomPhotos } from "~/lib/unsplash";

const staleTime = 1000 * 60 * 60 * 2;

export const useGetRandomPhotos = ({ count }: { count?: number } = {}) =>
  useQuery({
    queryKey: ["random-photos", count],
    queryFn: () => getRandomPhotos({ count }),
    staleTime,
  });

export const useGetPhotosByQuery = ({ query }: { query: string }) =>
  useQuery({
    queryKey: ["photos", query],
    queryFn: () => getPhotosByQuery({ query }),
    staleTime,
    enabled: !!query,
  });

// infinite query versions for pagination
export const useInfiniteRandomPhotos = ({ count = 20 }: { count?: number } = {}) =>
  useInfiniteQuery({
    queryKey: ["infinite-photos", count],
    queryFn: ({ pageParam = 1 }) => getRandomPhotos({ count, page: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      // unsplash has many pages, just keep going
      return allPages.length + 1;
    },
    initialPageParam: 1,
    staleTime,
  });

export const useInfinitePhotosByQuery = ({ query }: { query: string }) =>
  useInfiniteQuery({
    queryKey: ["infinite-search-photos", query],
    queryFn: ({ pageParam = 1 }) => getPhotosByQuery({ query, page: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      if (allPages.length >= lastPage.totalPages) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
    staleTime,
    enabled: !!query,
  });
