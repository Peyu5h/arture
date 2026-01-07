import createKyInstance from "./instance";
import { DEFAULT_CONFIG } from "./config";
import type { ApiConfig, APIResponse } from "./types";
import ky from "ky";

let instance = createKyInstance();
let currentConfig: ApiConfig = DEFAULT_CONFIG;

// Create a separate Ky instance for FormData requests without default headers
const formDataInstance = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  timeout: 60000,
  credentials: "include",
});

// Create a separate instance for AI endpoints with longer timeout
const aiInstance = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  timeout: 120000,
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
});

// AI endpoints that need longer timeout
const AI_ENDPOINTS = [
  "api/chat/ai-response",
  "api/chat/generate-title",
  "api/chat/messages",
];

function isAIEndpoint(url: string): boolean {
  return AI_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

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
    const kyInstance = isAIEndpoint(cleanUrl) ? aiInstance : instance;
    return kyInstance.get(cleanUrl).json<APIResponse<T>>();
  },

  post: async <T>(url: string, data?: unknown): Promise<APIResponse<T>> => {
    const cleanUrl = url.replace(/^\//, "");
    const isFormData = data instanceof FormData;

    if (isFormData) {
      return formDataInstance
        .post(cleanUrl, {
          body: data as FormData,
        })
        .json<APIResponse<T>>();
    }

    const kyInstance = isAIEndpoint(cleanUrl) ? aiInstance : instance;
    return kyInstance.post(cleanUrl, { json: data }).json<APIResponse<T>>();
  },

  postForm: async <T>(
    url: string,
    formData: FormData,
  ): Promise<APIResponse<T>> => {
    const cleanUrl = url.replace(/^\//, "");
    return formDataInstance
      .post(cleanUrl, {
        body: formData,
      })
      .json<APIResponse<T>>();
  },

  put: async <T>(url: string, data?: unknown): Promise<APIResponse<T>> => {
    const cleanUrl = url.replace(/^\//, "");
    const kyInstance = isAIEndpoint(cleanUrl) ? aiInstance : instance;
    return kyInstance.put(cleanUrl, { json: data }).json<APIResponse<T>>();
  },

  patch: async <T>(url: string, data?: unknown): Promise<APIResponse<T>> => {
    const cleanUrl = url.replace(/^\//, "");
    return instance.patch(cleanUrl, { json: data }).json<APIResponse<T>>();
  },

  delete: async <T>(url: string): Promise<APIResponse<T>> => {
    const cleanUrl = url.replace(/^\//, "");
    return instance.delete(cleanUrl).json<APIResponse<T>>();
  },
};

export default api;
