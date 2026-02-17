import { ref } from 'vue';
import { useApi } from './useApi';

export type PokemonListItem = {
  name: string;
  url: string;
  id?: number;
};

export type PaginatedList<T> = {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: Array<T>;
};

export type SimplifiedPokemon = {
  id: number;
  name: string;
  sprites: { front_default?: string | null; other?: any };
  types: Array<string>;
  stats: Array<{ name: string; base: number }>;
  abilities: Array<string>;
  evolutions?: Array<{ id: number | null; name: string; sprite: string | null }>;
};

export function usePokemon() {
  const { request } = useApi();

  const list = ref<Array<PokemonListItem>>([]);
  const count = ref(0);
  const loadingList = ref(false);
  const listError = ref<string | null>(null);

  const loadingDetail = ref(false);
  const detailError = ref<string | null>(null);

  function extractIdFromUrl(url?: string) {
    const m = (url || '').match(/\/pokemon\/(\d+)\/?$/);
    return m ? Number(m[1]) : undefined;
  }

  async function fetchList(limit = 20, offset = 0) {
    loadingList.value = true;
    listError.value = null;
    try {
      const res = await request<PaginatedList<PokemonListItem>>('get', '/pokemon', {
        params: { limit, offset },
      });

      const payload = (res.data && (res.data as any).data) ?? res.data;
      if (res.status >= 200 && res.status < 300 && payload) {
        const newItems = (payload.results || []).map((r: any) => {
          const id = extractIdFromUrl(r.url);
          return id !== undefined ? { name: r.name, url: r.url, id } : { name: r.name, url: r.url };
        }) as Array<{ name: string; url: string; id?: number }>;

        if (offset === 0) {
          list.value = newItems;
        } else {
          list.value.push(...newItems);
        }

        count.value = payload.count ?? 0;
        return true;
      } else {
        listError.value = (res as any).message ?? (res as any).title ?? `Error ${res.status}`;
        return false;
      }
    } catch (err: unknown) {
      if (err instanceof Error) listError.value = err.message;
      else listError.value = String(err);
      return false;
    } finally {
      loadingList.value = false;
    }
  }

  async function fetchDetail(
    nameOrId: string,
    opts?: { includeEvolutions?: boolean },
  ): Promise<SimplifiedPokemon | null> {
    const key = String(nameOrId).toLowerCase();
    const includeEvolutions = opts?.includeEvolutions ?? true;

    loadingDetail.value = true;
    detailError.value = null;
    try {
      const res = await request<any>('get', `/pokemon/${encodeURIComponent(key)}`, {
        params: { includeEvolutions },
      });

      const payload = (res.data && res.data.data) ?? res.data;

      if (res.status >= 200 && res.status < 300 && payload) {
        const data = payload;

        const mapped: SimplifiedPokemon = {
          id: data.id,
          name: data.name,
          sprites: data.sprites ?? {},
          types: Array.isArray(data.types) ? data.types : (data.types ?? []).map((t: any) => t),
          stats:
            Array.isArray(data.stats) && data.stats.length > 0
              ? data.stats.map((s: any) => ({ name: s.name, base: s.base }))
              : [],
          abilities: Array.isArray(data.abilities)
            ? data.abilities
            : (data.abilities ?? []).map((a: any) => a),
        };
        if (Array.isArray(data.evolutions)) {
          mapped.evolutions = data.evolutions.map((e: any) => ({
            id: e.id ?? null,
            name: e.name,
            sprite: e.sprite ?? null,
          }));
        }

        return mapped;
      } else {
        detailError.value = (res as any).message ?? (res as any).title ?? `Error ${res.status}`;
        return null;
      }
    } catch (err: any) {
      detailError.value = err?.message ?? 'Network error';
      return null;
    } finally {
      loadingDetail.value = false;
    }
  }

  const hasMore = (limit: number, offset: number) => offset + limit < count.value;

  return {
    list,
    count,
    loadingList,
    listError,
    fetchList,
    loadingDetail,
    detailError,
    fetchDetail,

    // utils
    hasMore,
  };
}
