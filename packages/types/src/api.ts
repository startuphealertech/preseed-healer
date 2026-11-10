/** Standard envelope for every API response. */
export type ApiSuccess<T> = { ok: true; data: T };

export type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    /** Field-level validation messages, keyed by dotted path. */
    fields?: Record<string, string[]>;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
