import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import axios from 'axios';

export type ApiResult<T = any> = {
  status: number;
  title?: string | undefined;
  message?: string | undefined;
  data: T | null;
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

function normalizeError<T>(err: any): ApiResult<T> {
  if (err?.response?.data && typeof err.response.data === 'object' && 'status' in err.response.data) return err.response.data as ApiResult<T>;

  if (err?.response) {
    return {
      status: err.response.status ?? 502,
      title: err.response.statusText ?? 'Error',
      message: (err.response.data && (err.response.data.message || JSON.stringify(err.response.data))) || err.message,
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

export async function postApi<T = any, B = any>(
  path: string,
  body?: B,
  params?: Record<string, any>,
  config?: AxiosRequestConfig,
): Promise<ApiResult<T>> {
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
