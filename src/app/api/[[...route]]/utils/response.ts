type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: Array<{
    message: string;
    code: string;
    path?: string[];
  }>;
};

export const success = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

export const err = (
  message: string,
  code = "server_error",
  path?: string[],
): ApiResponse<never> => ({
  success: false,
  error: [{ message, code, path }],
});

export const validationErrorResponse = (
  errors: Array<{ message: string; path?: string[] }>,
): ApiResponse<never> => ({
  success: false,
  error: errors.map((error) => ({
    ...error,
    code: "validation_error",
  })),
});
