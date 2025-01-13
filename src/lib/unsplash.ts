import { SearchResponse } from "./types";

import ky from "ky";
import { UnsplashImage } from "./types";

const clientId = process.env.NEXT_PUBLIC_UNSPLASH_CLIENT_ID;
const UNSPLASH_ROOT = "https://api.unsplash.com";

export const getRandomPhotos = async ({ count = 20 }: { count?: number }) => {
  const response = await ky
    .get(`${UNSPLASH_ROOT}/photos/random?client_id=${clientId}&count=${count}`)
    .json<UnsplashImage[]>();

  return response;
};

export const getPhotosByQuery = async ({ query }: { query: string }) => {
  const response = await ky
    .get(
      `${UNSPLASH_ROOT}/search/photos?query=${query}&client_id=${clientId}&per_page=20`,
    )
    .json<SearchResponse>();

  return response.results;
};
