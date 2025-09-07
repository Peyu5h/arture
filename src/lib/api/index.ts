import createKyInstance from "./instance";
import { DEFAULT_CONFIG } from "./config";
import type { ApiConfig, APIResponse } from "./types";
import ky from "ky";

let instance = createKyInstance();
let currentConfig: ApiConfig = DEFAULT_CONFIG;

// Create a separate Ky instance for FormData requests without default headers
const formDataInstance = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  // No default headers for FormData
});

export const configureApi = (config: Partial<ApiConfig> = {}) => {
  currentConfig = {
    ...currentConfig,
    ...config,
    headers: {
      ...currentConfig.headers,
      ...config.headers,
    },
  };
  instance = createKyInstance(currentConfig);
};

export const setAuthToken = (token?: string) => {
  if (!currentConfig.enableAuth) {
    console.warn(
      "Auth is not enabled. Enable it by calling configureApi with enableAuth: true",
    );
    return;
  }

  configureApi({
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
};

export const api = {
  get: async <T>(url: string): Promise<APIResponse<T>> => {
    const cleanUrl = url.replace(/^\//, "");
    return instance.get(cleanUrl).json<APIResponse<T>>();
  },

  post: async <T>(url: string, data?: unknown): Promise<APIResponse<T>> => {
    const cleanUrl = url.replace(/^\//, "");

    // Check if data is FormData
    const isFormData = data instanceof FormData;

    console.log("API post - URL:", cleanUrl);
    console.log("API post - Data type:", typeof data);
    console.log("API post - Is FormData:", isFormData);
    console.log(
      "API post - Data instanceof FormData:",
      data instanceof FormData,
    );

    if (isFormData) {
      console.log("Sending as FormData using formDataInstance");
      // Use the separate instance without default headers for FormData
      return formDataInstance
        .post(cleanUrl, {
          body: data as FormData,
        })
        .json<APIResponse<T>>();
    }

    console.log("Sending as JSON");
    return instance.post(cleanUrl, { json: data }).json<APIResponse<T>>();
  },

  postForm: async <T>(
    url: string,
    formData: FormData,
  ): Promise<APIResponse<T>> => {
    const cleanUrl = url.replace(/^\//, "");
    console.log("API postForm - URL:", cleanUrl);
    console.log("API postForm - FormData:", formData);
    // Use the separate instance without default headers for FormData
    return formDataInstance
      .post(cleanUrl, {
        body: formData,
      })
      .json<APIResponse<T>>();
  },

  put: async <T>(url: string, data?: unknown): Promise<APIResponse<T>> => {
    const cleanUrl = url.replace(/^\//, "");
    return instance.put(cleanUrl, { json: data }).json<APIResponse<T>>();
  },

  delete: async <T>(url: string): Promise<APIResponse<T>> => {
    const cleanUrl = url.replace(/^\//, "");
    return instance.delete(cleanUrl).json<APIResponse<T>>();
  },
};

export default api;
