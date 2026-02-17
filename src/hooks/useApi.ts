import { ref } from 'vue';
import type { AxiosRequestConfig } from 'axios';
import client from 'src/lib/apiClient';
import type { ApiResult as ClientApiResult } from 'src/lib/apiClient';

export function useApi() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  function reset() {
    loading.value = false;
    error.value = null;
  }

  async function request<T = any>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    opts?: { params?: any; body?: any; config?: AxiosRequestConfig },
  ): Promise<ClientApiResult<T>> {
    loading.value = true;
    error.value = null;

    const cfg = { ...(opts?.config || {}) } as AxiosRequestConfig;

    try {
      let res;
      if (method === 'get') res = await client.get(url, { params: opts?.params, ...cfg });
      else if (method === 'post') res = await client.post(url, opts?.body ?? {}, cfg);
      else if (method === 'put') res = await client.put(url, opts?.body ?? {}, cfg);
      else res = await client.delete(url, cfg);

      const raw = res.data;

      if (raw && typeof raw === 'object' && 'status' in raw && 'data' in raw) {
        const typed = raw as ClientApiResult<T>;
        return {
          status: typed.status ?? res.status ?? 200,
          title: typed.title,
          message: typed.message,
          data: (typed.data ?? null) as T | null,
        };
      }

      return {
        status: res.status ?? 200,
        title: res.status >= 200 && res.status < 300 ? 'OK' : res.statusText,
        message: '',
        data: (raw ?? null) as T | null,
      };
    } catch (err: any) {
      const status = err?.response?.status ?? 0;
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Network error or server unreachable';
      error.value = message;
      return { status, title: err?.response?.statusText, message, data: null };
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, request, reset };
}
