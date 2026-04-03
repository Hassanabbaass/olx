import { useEffect, useState, useCallback } from 'react';
import { fetchCategories, fetchCategoryFields } from '../api/categoriesApi';
import { useAppContext } from '../store/AppContext';
import { Category, CategoryFieldsMap } from '../types';

interface UseCategoriesResult {
  categories: Category[];
  categoryFieldsMap: CategoryFieldsMap;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Fetches and caches the full category tree and all category fields.
 * Results are stored in AppContext so they are only fetched once per session.
 */
const useCategories = (): UseCategoriesResult => {
  const { categories, categoryFieldsMap, isCategoriesLoaded, setCategories, setCategoryFieldsMap } =
    useAppContext();

  const [isLoading, setIsLoading] = useState(!isCategoriesLoaded);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch categories first — needed to map internal IDs → externalIDs for fields
      const cats = await fetchCategories();
      const fieldsMap = await fetchCategoryFields(cats);
      setCategories(cats);
      setCategoryFieldsMap(fieldsMap);
    } catch (err: any) {
      setError('Failed to load categories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [setCategories, setCategoryFieldsMap]);

  useEffect(() => {
    if (!isCategoriesLoaded) {
      load();
    }
  }, [isCategoriesLoaded, load]);

  return {
    categories,
    categoryFieldsMap,
    isLoading,
    error,
    refresh: load,
  };
};

export default useCategories;
