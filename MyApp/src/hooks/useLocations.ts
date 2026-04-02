import { useState, useCallback } from 'react';
import { fetchLocations } from '../api/adsApi';
import { Location } from '../types';

// Lebanon root hierarchy IDs
export const LEBANON_HIERARCHY_ID = '1-30';
export const LEBANON_LEVEL = 2;

interface UseLocationsResult {
  locations: Location[];
  isLoading: boolean;
  error: string | null;
  fetchForHierarchy: (hierarchyID: string, level: number) => Promise<void>;
  fetchLebanon: () => Promise<void>;
}

/**
 * Fetches location options for a given hierarchy level.
 * Defaults to Lebanese governorates (level 2 under hierarchy "1-30").
 */
const useLocations = (): UseLocationsResult => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForHierarchy = useCallback(
    async (hierarchyID: string, level: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchLocations(hierarchyID, level);
        setLocations(result);
      } catch {
        setError('Failed to load locations.');
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const fetchLebanon = useCallback(() => {
    return fetchForHierarchy(LEBANON_HIERARCHY_ID, LEBANON_LEVEL);
  }, [fetchForHierarchy]);

  return {
    locations,
    isLoading,
    error,
    fetchForHierarchy,
    fetchLebanon,
  };
};

export default useLocations;
