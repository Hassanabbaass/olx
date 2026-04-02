import { searchApi } from './axiosInstance';
import { Ad, AdImage, AdLocation, AdCategory, Location, SearchFilters } from '../types';

// ─── Indexes ──────────────────────────────────────────────────────────────────

const ADS_INDEX = 'olx-lb-production-ads-en';
const LOCATIONS_INDEX = 'olx-lb-production-locations-en';

// ─── Raw API shapes ───────────────────────────────────────────────────────────

interface RawAdMedia {
  url?: string;
  thumbnail?: string;
  id?: string;
}

interface RawAdPrice {
  value?: number;
  currency?: string;
}

interface RawAdLocation {
  externalID?: string;
  name?: string;
  nameAr?: string;
  city?: string;
  country?: string;
}

interface RawAdCategory {
  externalID?: string;
  name?: string;
  nameAr?: string;
}

interface RawAdSource {
  id: string;
  title?: string;
  titleAr?: string;
  description?: string;
  price?: RawAdPrice;
  media?: RawAdMedia[];
  location?: RawAdLocation;
  category?: RawAdCategory;
  timestamp?: number;
  isElite?: boolean;
  isFeatured?: boolean;
  contactPhone?: string;
  params?: Record<string, { value: string | number; key: string; label?: string }>;
}

interface RawHit {
  _id: string;
  _source: RawAdSource;
}

interface RawSearchResponse {
  hits: {
    total: { value: number } | number;
    hits: RawHit[];
  };
}

interface MsearchResponse {
  responses: RawSearchResponse[];
}

interface RawLocationSource {
  externalID?: string;
  name?: string;
  nameAr?: string;
  level?: number;
  hierarchy?: Array<{ externalID: string; name: string; level: number }>;
}

// ─── Normalizers ──────────────────────────────────────────────────────────────

const normalizeAd = (hit: RawHit): Ad => {
  const s = hit._source;

  const images: AdImage[] = (s.media ?? []).map((m, idx) => ({
    id: m.id ?? String(idx),
    url: m.url ?? '',
    thumbnail: m.thumbnail ?? m.url ?? '',
  }));

  const location: AdLocation = {
    externalID: s.location?.externalID ?? '',
    name: s.location?.name ?? '',
    nameAr: s.location?.nameAr,
    city: s.location?.city,
    country: s.location?.country,
  };

  const category: AdCategory = {
    externalID: s.category?.externalID ?? '',
    name: s.category?.name ?? '',
    nameAr: s.category?.nameAr,
  };

  // Flatten params into specs map
  const specs: Record<string, string | number> = {};
  if (s.params) {
    for (const param of Object.values(s.params)) {
      if (param.key && param.value !== undefined) {
        specs[param.key] = param.value;
      }
    }
  }

  return {
    id: s.id ?? hit._id,
    title: s.title ?? '',
    titleAr: s.titleAr,
    description: s.description,
    price: s.price?.value,
    currency: s.price?.currency ?? 'USD',
    images,
    location,
    category,
    timestamp: s.timestamp ?? 0,
    isElite: s.isElite ?? false,
    isFeatured: s.isFeatured ?? false,
    isFavorite: false,
    specs,
    contactPhone: s.contactPhone,
  };
};

const normalizeLocation = (hit: { _source: RawLocationSource }): Location => ({
  externalID: hit._source.externalID ?? '',
  name: hit._source.name ?? '',
  nameAr: hit._source.nameAr,
  level: hit._source.level ?? 0,
  hierarchy: hit._source.hierarchy,
});

// ─── NDJSON Builder ───────────────────────────────────────────────────────────

/**
 * Builds an NDJSON string for Elasticsearch _msearch.
 * Each pair is: header line + query line, both terminated with \n.
 * Content-Type must be application/x-ndjson — standard JSON will return 400.
 */
const buildNdjson = (index: string, query: object): string =>
  JSON.stringify({ index }) + '\n' + JSON.stringify(query) + '\n';

// ─── Query Builder ────────────────────────────────────────────────────────────

type SortOrder = { order: 'asc' | 'desc' };

const buildAdsQuery = (
  from: number,
  size: number,
  filters: SearchFilters,
): object => {
  const must: object[] = [];

  if (filters.categoryID) {
    must.push({ term: { 'category.externalID': filters.categoryID } });
  }

  if (filters.locationID) {
    must.push({ term: { 'location.externalID': filters.locationID } });
  }

  if (filters.keyword) {
    must.push({
      multi_match: {
        query: filters.keyword,
        fields: ['title', 'title_ar', 'description'],
        type: 'best_fields',
        fuzziness: 'AUTO',
      },
    });
  }

  if (filters.condition && filters.condition !== 'any') {
    must.push({ term: { 'params.condition.value': filters.condition } });
  }

  // Dynamic fields (from categoryFields API: color, brand, kilometers, etc.)
  if (filters.dynamicFields) {
    for (const [key, value] of Object.entries(filters.dynamicFields)) {
      if (value === undefined || value === null) {
        continue;
      }
      if (Array.isArray(value)) {
        if (value.length === 2 && typeof value[0] === 'number') {
          // Range filter [min, max]
          must.push({ range: { [`params.${key}.value`]: { gte: value[0], lte: value[1] } } });
        } else if (value.length > 0) {
          // Multi-select: match any of the values
          must.push({ terms: { [`params.${key}.value`]: value } });
        }
      } else {
        must.push({ term: { [`params.${key}.value`]: value } });
      }
    }
  }

  // Price range
  const priceRange: { gte?: number; lte?: number } = {};
  if (filters.priceMin !== undefined) {
    priceRange.gte = filters.priceMin;
  }
  if (filters.priceMax !== undefined) {
    priceRange.lte = filters.priceMax;
  }
  if (Object.keys(priceRange).length > 0) {
    must.push({ range: { 'price.value': priceRange } });
  }

  // Sort
  let sort: Record<string, SortOrder>[];
  switch (filters.sortBy) {
    case 'price_asc':
      sort = [{ 'price.value': { order: 'asc' } }, { id: { order: 'desc' } }];
      break;
    case 'price_desc':
      sort = [{ 'price.value': { order: 'desc' } }, { id: { order: 'desc' } }];
      break;
    default:
      sort = [{ timestamp: { order: 'desc' } }, { id: { order: 'desc' } }];
  }

  return {
    from,
    size,
    track_total_hits: 200000,
    query: { bool: { must: must.length > 0 ? must : [{ match_all: {} }] } },
    sort,
  };
};

// ─── API Calls ────────────────────────────────────────────────────────────────

export interface FetchAdsResult {
  ads: Ad[];
  total: number;
}

/**
 * Fetches ads from Elasticsearch via _msearch NDJSON endpoint.
 */
export const fetchAds = async (
  from: number,
  size: number,
  filters: SearchFilters,
): Promise<FetchAdsResult> => {
  const query = buildAdsQuery(from, size, filters);
  const body = buildNdjson(ADS_INDEX, query);

  const response = await searchApi.post<MsearchResponse>('/_msearch', body, {
    headers: { 'Content-Type': 'application/x-ndjson' },
  });

  const result = response.data.responses?.[0];
  if (!result) {
    return { ads: [], total: 0 };
  }

  const total =
    typeof result.hits.total === 'number'
      ? result.hits.total
      : result.hits.total?.value ?? 0;

  const ads = result.hits.hits.map(normalizeAd);
  return { ads, total };
};

/**
 * Fetches only the total count for a given set of filters (used by "See X Results" CTA).
 */
export const fetchAdsCount = async (filters: SearchFilters): Promise<number> => {
  const query = buildAdsQuery(0, 0, filters);
  const body = buildNdjson(ADS_INDEX, query);

  const response = await searchApi.post<MsearchResponse>('/_msearch', body, {
    headers: { 'Content-Type': 'application/x-ndjson' },
  });

  const result = response.data.responses?.[0];
  if (!result) {
    return 0;
  }
  return typeof result.hits.total === 'number'
    ? result.hits.total
    : result.hits.total?.value ?? 0;
};

/**
 * Fetches locations for a given hierarchy externalID and level.
 * e.g. hierarchyID="1-30", level=2 returns all Lebanese governorates.
 */
export const fetchLocations = async (
  hierarchyID: string,
  level: number,
): Promise<Location[]> => {
  const query = {
    from: 0,
    size: 10000,
    track_total_hits: false,
    query: {
      bool: {
        must: [
          { term: { 'hierarchy.externalID': hierarchyID } },
          { term: { level } },
        ],
      },
    },
    sort: [{ name: { order: 'asc' } }],
    timeout: '5s',
  };

  const body = buildNdjson(LOCATIONS_INDEX, query);

  const response = await searchApi.post<MsearchResponse>('/_msearch', body, {
    headers: { 'Content-Type': 'application/x-ndjson' },
  });

  const result = response.data.responses?.[0];
  if (!result) {
    return [];
  }

  return result.hits.hits.map(hit =>
    normalizeLocation(hit as unknown as { _source: RawLocationSource }),
  );
};
