import { useState, useCallback, useRef } from 'react';
import { fetchAds, FetchAdsResult } from '../api/adsApi';
import { Ad, SearchFilters } from '../types';

const PAGE_SIZE = 12;

interface UseFetchAdsResult {
  ads: Ad[];
  total: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  search: (filters: SearchFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
}

/**
 * Manages ad fetching with pagination.
 * - `search()` resets and fetches page 1 with the given filters.
 * - `loadMore()` appends the next page to the existing results.
 */
const useFetchAds = (): UseFetchAdsResult => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep current filters and offset in refs to avoid stale closure issues
  const currentFilters = useRef<SearchFilters>({});
  const currentFrom = useRef(0);
  const isFetching = useRef(false);

  const search = useCallback(async (filters: SearchFilters) => {
    if (isFetching.current) {
      console.log('[useFetchAds] search skipped — already fetching');
      return;
    }
    console.log('[useFetchAds] search() called, filters:', JSON.stringify(filters));
    isFetching.current = true;
    currentFilters.current = filters;
    currentFrom.current = 0;

    setIsLoading(true);
    setError(null);
    setAds([]);
    setTotal(0);

    try {
      const result: FetchAdsResult = await fetchAds(0, PAGE_SIZE, filters);
      console.log('[useFetchAds] search() done — total:', result.total, 'ads received:', result.ads.length);
      setAds(result.ads);
      setTotal(result.total);
      currentFrom.current = PAGE_SIZE;
    } catch (err) {
      console.error('[useFetchAds] search() error:', err);
      setError('Failed to load ads. Please check your connection.');
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (isFetching.current) {
      return;
    }
    const from = currentFrom.current;
    if (from >= total && total > 0) {
      return;
    }

    isFetching.current = true;
    setIsLoadingMore(true);
    setError(null);

    try {
      const result: FetchAdsResult = await fetchAds(
        from,
        PAGE_SIZE,
        currentFilters.current,
      );
      setAds(prev => [...prev, ...result.ads]);
      setTotal(result.total);
      currentFrom.current = from + PAGE_SIZE;
    } catch {
      setError('Failed to load more ads.');
    } finally {
      setIsLoadingMore(false);
      isFetching.current = false;
    }
  }, [total]);

  const reset = useCallback(() => {
    setAds([]);
    setTotal(0);
    setError(null);
    currentFrom.current = 0;
    currentFilters.current = {};
  }, []);

  const hasMore = ads.length < total;

  return {
    ads,
    total,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    search,
    loadMore,
    reset,
  };
};

export default useFetchAds;
