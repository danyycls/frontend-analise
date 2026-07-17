import { API_BASE_URL, P2_API_BASE_URL } from '../config';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | undefined>;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function createClient(baseUrl: string) {
  async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { body, params, headers: customHeaders, ...rest } = options;

    let url = `${baseUrl}${endpoint}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: HeadersInit = {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(customHeaders || {}),
    };

    const response = await fetch(url, {
      ...rest,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erro desconhecido');
      throw new ApiError(response.status, errorText);
    }

    return response.json();
  }

  return {
    get: <T>(endpoint: string, params?: Record<string, string | number | undefined>, options?: Omit<RequestInit, 'body' | 'method'>) =>
      request<T>(endpoint, { method: 'GET', params, ...options }),

    post: <T>(endpoint: string, body?: unknown, options?: Omit<RequestInit, 'body' | 'method'>) =>
      request<T>(endpoint, { method: 'POST', body, ...options }),

    put: <T>(endpoint: string, body?: unknown) =>
      request<T>(endpoint, { method: 'PUT', body }),

    delete: <T>(endpoint: string, params?: Record<string, string | number | undefined>) =>
      request<T>(endpoint, { method: 'DELETE', params }),
  };
}

export const api = createClient(API_BASE_URL);
export const apiP2 = createClient(P2_API_BASE_URL);

export { ApiError };
