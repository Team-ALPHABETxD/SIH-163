// Centralized API client supporting both Mock Mode and Real Flask/FastAPI Backend

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Reads from localStorage first so user can switch between Mock and Real in UI settings
export const getUseMockData = (): boolean => {
  const stored = localStorage.getItem('sentinel_use_mock_data');
  if (stored !== null) {
    return stored === 'true';
  }
  return import.meta.env.VITE_USE_MOCK_DATA !== 'false';
};

export const setUseMockData = (value: boolean) => {
  localStorage.setItem('sentinel_use_mock_data', value ? 'true' : 'false');
};

export const getApiBaseUrl = (): string => {
  return localStorage.getItem('sentinel_api_base_url') || API_BASE_URL;
};

export const setApiBaseUrl = (url: string) => {
  localStorage.setItem('sentinel_api_base_url', url);
};

export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        data: null as unknown as T,
        error: `HTTP ${res.status}: ${errText || res.statusText}`,
        status: res.status,
      };
    }

    const data = await res.json();
    return { data, status: res.status };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error or backend unreachable';
    return {
      data: null as unknown as T,
      error: message,
      status: 0,
    };
  }
}

export async function checkBackendHealth(): Promise<{ connected: boolean; message: string; latency?: number }> {
  if (getUseMockData()) {
    // In mock mode, we simulate a healthy mock service
    return { connected: true, message: 'Mock Service Active (Local Data Mode)' };
  }

  const start = performance.now();
  try {
    const baseUrl = getApiBaseUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const latency = Math.round(performance.now() - start);

    if (res.ok) {
      return { connected: true, message: 'FastAPI/Flask Backend Online', latency };
    }
    return { connected: false, message: `Backend error (HTTP ${res.status})` };
  } catch {
    return { connected: false, message: 'Backend Offline / Unreachable' };
  }
}
