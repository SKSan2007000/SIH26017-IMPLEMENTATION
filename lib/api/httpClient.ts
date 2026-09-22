/**
 * lib/api/httpClient — robust typed wrapper around fetch for the FastAPI backend.
 *
 * Supports NEXT_PUBLIC_API_URL (e.g. http://localhost:8000/api/v1 or http://localhost:8000)
 * with token injection and standard HTTP methods.
 */

let customApiBaseUrl: string | null = null;

export function getApiBaseUrl(): string {
  if (customApiBaseUrl !== null) {
    return customApiBaseUrl;
  }
  if (process.env.NEXT_PUBLIC_API_BASE_URL !== undefined && process.env.NEXT_PUBLIC_API_BASE_URL !== '') {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (process.env.NEXT_PUBLIC_API_URL !== undefined && process.env.NEXT_PUBLIC_API_URL !== '') {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  // Client-side execution in browser
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      // Production deployment on Vercel / custom domain uses same-origin relative paths
      return '';
    }
  }
  // Local development fallback
  return 'http://127.0.0.1:8000';
}

export function setApiBaseUrl(url: string) {
  customApiBaseUrl = url;
}

export function isBackendConfigured(): boolean {
  return true;
}

export class ApiError extends Error {
  status: number;
  data?: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('landguard_token');
  }
  return null;
}

export function normalizePath(base: string, path: string): string {
  let cleanBase = (base || '').replace(/\/+$/, '');
  let cleanPath = path.startsWith('/') ? path : `/${path}`;

  // If base does not contain /api and cleanPath does not start with /api or root endpoints (/health, /docs), route via /api/v1
  if (
    !cleanBase.includes('/api') &&
    !cleanPath.startsWith('/api') &&
    !cleanPath.startsWith('/health') &&
    !cleanPath.startsWith('/docs') &&
    !cleanPath.startsWith('/redoc') &&
    !cleanPath.startsWith('/openapi.json')
  ) {
    cleanPath = `/api/v1${cleanPath}`;
  }

  // If base already ends with /api/v1 and path starts with /api/v1, don't duplicate
  if (cleanBase.endsWith('/api/v1') && cleanPath.startsWith('/api/v1')) {
    return `${cleanBase}${cleanPath.substring(7)}`;
  }
  // If base ends with /api and path starts with /api, don't duplicate
  if (cleanBase.endsWith('/api') && cleanPath.startsWith('/api')) {
    return `${cleanBase}${cleanPath.substring(4)}`;
  }

  return `${cleanBase}${cleanPath}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error('NEXT_PUBLIC_API_URL is not set — httpClient should not be called without it.');
  }

  const url = normalizePath(base, path);
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> ?? {}),
  };

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers,
      cache: init?.cache ?? 'no-store',
    });
  } catch (networkErr: any) {
    const errorMsg = networkErr?.message === 'Failed to fetch'
      ? `Backend unavailable: Unable to connect to LandGuard API at ${url}. Please confirm the FastAPI server is running.`
      : `Network error connecting to ${url}: ${networkErr?.message || 'Connection failed'}`;
    throw new ApiError(errorMsg, 0, { originalError: networkErr?.message });
  }

  if (!res.ok) {
    let body: any = '';
    try {
      body = await res.json();
    } catch {
      body = await res.text().catch(() => '');
    }
    const msg = typeof body === 'object' && body?.detail ? body.detail : `${init?.method ?? 'GET'} ${path} failed: ${res.status}`;
    throw new ApiError(msg, res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const http = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
