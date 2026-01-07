import { ApiConfig } from "./types";

export const DEFAULT_CONFIG: ApiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 90000,
  headers: {
    "Content-Type": "application/json",
  },
  enableAuth: false,
};
