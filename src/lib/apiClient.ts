import type { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { AxiosHeaders } from 'axios';
import axios from 'axios';

export type ApiResult<T = any> = {
  status: number;
  title?: string | undefined;
  message?: string | undefined;
  data: T | null;
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? '/api';

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let onUnauthorized: (err?: any) => void | Promise<void> = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch (e) {
    console.warn('Error clearing auth storage:', e);
  }
  try {
    if (typeof window !== 'undefined' && window.location) window.location.href = '/login';
  } catch (e) {
    console.warn('Error redirecting to login:', e);
  }
};

export function setOnUnauthorizedHandler(fn: (err?: any) => void | Promise<void>) {
  onUnauthorized = fn;
}

export function clearAuthStorage() {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch (e) {
    console.warn('Error clearing auth storage:', e);
  }
}

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return config;

    const headers = new AxiosHeaders(config.headers);
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    config.headers = headers;
  } catch (e) {
    console.warn('Error setting auth header:', e);
  }
  return config;
});

let _lastUnauthorizedAt = 0;
const UNAUTHORIZED_THROTTLE_MS = 800;

client.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    try {
      const status = error?.response?.status;
      const reqUrl = (error?.config && (error.config.url || '')) as string;

      if (status === 401) {
        if (/\/auth(\/|$)/i.test(reqUrl)) {
          console.warn('401 en endpoint de auth — se omite handler global:', reqUrl);
        } else {
          const now = Date.now();
          if (now - _lastUnauthorizedAt > UNAUTHORIZED_THROTTLE_MS) {
            _lastUnauthorizedAt = now;
            try {
              void onUnauthorized(error);
            } catch (e) {
              console.error('onUnauthorized handler failed', e);
            }
          } else {
            console.warn('Ignorado onUnauthorized por throttle para', reqUrl);
          }
        }
      }
    } catch (innerErr) {
      console.error('Error en response interceptor al manejar 401:', innerErr);
    }
    throw error;
  },
);

function normalizeError<T>(err: any): ApiResult<T> {
  if (err?.response?.data && typeof err.response.data === 'object' && 'status' in err.response.data) return err.response.data as ApiResult<T>;

  if (err?.response) {
    return {
      status: err.response.status ?? 502,
      title: err.response.statusText ?? 'Error',
      message: (err.response.data && (err.response.data.message || JSON.stringify(err.response.data))) || err.message || 'Error',
      data: null,
    };
  }
  return {
    status: 502,
    title: 'Network Error',
    message: err?.message ?? 'Network error',
    data: null,
  };
}

export async function getApi<T = any>(path: string, params?: Record<string, any>, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
  try {
    const res = await client.get(path, { params, ...(config || {}) });
    const data = res.data;
    if (data && typeof data === 'object' && 'status' in data) return data as ApiResult<T>;
    return {
      status: res.status,
      title: res.status >= 200 && res.status < 300 ? 'OK' : res.statusText,
      message: '',
      data: data as T,
    };
  } catch (err: any) {
    return normalizeError<T>(err);
  }
}

export async function postApi<T = any, B = any>(path: string, body?: B, params?: Record<string, any>, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
  try {
    const res = await client.post(path, body, { params, ...(config || {}) });
    const data = res.data;
    if (data && typeof data === 'object' && 'status' in data) return data as ApiResult<T>;
    return { status: res.status, title: res.statusText, message: '', data: data as T };
  } catch (err: any) {
    return normalizeError<T>(err);
  }
}

export default client;
