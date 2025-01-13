import { useQuery } from "@tanstack/react-query";
import { getPhotosByQuery, getRandomPhotos } from "~/lib/unsplash";

const staleTime = 1000 * 60 * 60 * 2; // 2 hours

export const useGetRandomPhotos = ({ count = 20 }: { count?: number } = {}) =>
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
