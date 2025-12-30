import { SearchResponse } from "./types";

import ky from "ky";
import { UnsplashImage } from "./types";

const clientId = process.env.NEXT_PUBLIC_UNSPLASH_CLIENT_ID;
const UNSPLASH_ROOT = "https://api.unsplash.com";

export const getRandomPhotos = async ({ count, page = 1 }: { count?: number; page?: number }) => {
  try {
    const response = await ky
      .get(
        `${UNSPLASH_ROOT}/photos?client_id=${clientId}&per_page=${count || 20}&page=${page}`,
      )
      .json<UnsplashImage[]>();

    return response;
  } catch (error) {
    console.error("Error fetching photos from Unsplash:", error);
    throw error;
  }
};

export const getPhotosByQuery = async ({ query, page = 1, perPage = 18 }: { query: string; page?: number; perPage?: number }) => {
  try {
    const response = await ky
      .get(
        `${UNSPLASH_ROOT}/search/photos?query=${query}&client_id=${clientId}&per_page=${perPage}&page=${page}`,
      )
      .json<SearchResponse>();

    return {
      results: response.results,
      totalPages: response.total_pages || 1,
      total: response.total || 0,
    };
  } catch (error) {
    console.error("Error searching photos from Unsplash:", error);
    throw error;
  }
};
