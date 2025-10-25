import { SearchResponse } from "./types";

import ky from "ky";
import { UnsplashImage } from "./types";

const clientId = process.env.NEXT_PUBLIC_UNSPLASH_CLIENT_ID;
const UNSPLASH_ROOT = "https://api.unsplash.com";

export const getRandomPhotos = async ({ count }: { count?: number }) => {
  try {
    const response = await ky
      .get(
        `${UNSPLASH_ROOT}/photos/random?client_id=${clientId}&count=${count || 20}`,
      )
      .json<UnsplashImage[]>();

    console.log("Unsplash random photos response:", response);
    return response;
  } catch (error) {
    console.error("Error fetching random photos from Unsplash:", error);
    throw error;
  }
};

export const getPhotosByQuery = async ({ query }: { query: string }) => {
  try {
    const response = await ky
      .get(
        `${UNSPLASH_ROOT}/search/photos?query=${query}&client_id=${clientId}&per_page=18`,
      )
      .json<SearchResponse>();

    console.log("Unsplash search photos response:", response);
    return response.results;
  } catch (error) {
    console.error("Error searching photos from Unsplash:", error);
    throw error;
  }
};
