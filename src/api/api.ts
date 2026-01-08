export type RequestOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export type ApiError = Error & { status?: number; code?: string; payload?: any };

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5280/api/v1';

const parseResponse = async (response: Response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const buildError = (response: Response, payload: any): ApiError => {
  const message =
    payload?.detail ||
    payload?.message ||
    payload?.error?.message ||
    payload?.title ||
    `Request failed (${response.status})`;
  const error = new Error(message) as ApiError;
  error.status = response.status;
  error.code = payload?.title || payload?.code || payload?.error?.code || payload?.error;
  error.payload = payload;
  return error;
};

export const apiRequest = async <T>(
  path: string,
  { method = 'GET', body, headers, signal }: RequestOptions = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${path}`;
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers || {})
  };

  const options: RequestInit = { method, headers: requestHeaders, signal };
  if (body !== undefined) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const payload = await parseResponse(response);

  if (!response.ok) {
    throw buildError(response, payload);
  }

  return (payload?.data ?? payload) as T;
};

export const createIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};
