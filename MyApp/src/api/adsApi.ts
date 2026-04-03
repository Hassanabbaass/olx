import { searchApi } from './axiosInstance';
import { Ad, AdImage, AdLocation, AdCategory, Location, SearchFilters } from '../types';

// ─── Indexes ──────────────────────────────────────────────────────────────────

const ADS_INDEX = 'olx-lb-production-ads-en';
const LOCATIONS_INDEX = 'olx-lb-production-locations-en';

// ─── Raw API shapes ───────────────────────────────────────────────────────────

interface RawAdPhoto {
  url?: string;
  thumbnail?: string;
  id?: string;
}

// Actual _source shape from olx-lb-production-ads-en Elasticsearch index
interface RawAdSource {
  id?: number | string;
  title?: string;
  title_l1?: string;       // Arabic title
  description?: string;
  description_l1?: string;
  price?: number;           // flat number — 0 means no price listed
  currency?: string;
  coverPhoto?: string;      // main image URL (string)
  photos?: RawAdPhoto[];    // additional photos array
  media?: RawAdPhoto[];     // legacy fallback
  // Location stored as flat dotted fields
  location?: { externalID?: string; name?: string; name_l1?: string } | string;
  'location.lvl0'?: string;
  'location.lvl1'?: string;
  // Category stored as flat dotted fields
  category?: { externalID?: string; name?: string; name_l1?: string } | string;
  'category.lvl0'?: string;
  'category.lvl1'?: string;
  timestamp?: number;
  isElite?: boolean;
  isFeatured?: boolean;
  contactPhone?: string;
  contactInfo?: { phone?: string };
  extraFields?: Array<{ key: string; value: string | number }>;
  formattedExtraFields?: Array<{ key: string; value: string | number }>;
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

// Extracts a plain string URL from whatever the API returns (string or object)
const extractUrl = (val: unknown): string => {
  if (!val) { return ''; }
  if (typeof val === 'string') { return val; }
  if (typeof val === 'object') {
    const v = val as Record<string, unknown>;
    const u = v.url ?? v.thumbnail ?? v.src ?? v.path ?? '';
    return typeof u === 'string' ? u : '';
  }
  return '';
};

const normalizeAd = (hit: RawHit): Ad => {
  const s = hit._source;

  // ── Images ─────────────────────────────────────────────────────────────────
  const images: AdImage[] = [];
  const coverUrl = extractUrl(s.coverPhoto);
  if (coverUrl) {
    images.push({ id: '0', url: coverUrl, thumbnail: coverUrl });
  }
  const photoArray = s.photos ?? s.media ?? [];
  photoArray.forEach((p, idx) => {
    const url = extractUrl(p.url);
    if (url && url !== coverUrl) {
      images.push({ id: p.id ?? String(idx + 1), url, thumbnail: extractUrl(p.thumbnail) || url });
    }
  });

  // ── Location ────────────────────────────────────────────────────────────────
  const locObj = typeof s.location === 'object' ? s.location : null;
  const location: AdLocation = {
    externalID: locObj?.externalID ?? '',
    name: locObj?.name ?? (s as any)['location.lvl1'] ?? (s as any)['location.lvl0'] ?? '',
    nameAr: locObj?.name_l1,
  };

  // ── Category ────────────────────────────────────────────────────────────────
  const catObj = typeof s.category === 'object' ? s.category : null;
  const category: AdCategory = {
    externalID: catObj?.externalID ?? '',
    name: catObj?.name ?? (s as any)['category.lvl1'] ?? (s as any)['category.lvl0'] ?? '',
    nameAr: catObj?.name_l1,
  };

  // ── Price ───────────────────────────────────────────────────────────────────
  // price is a flat number; 0 means no price set → show "Price on request"
  const priceNum = typeof s.price === 'number' ? s.price : undefined;

  // ── Specs from extraFields ──────────────────────────────────────────────────
  const specs: Record<string, string | number> = {};
  (s.formattedExtraFields ?? s.extraFields ?? []).forEach(f => {
    if (f.key && f.value !== undefined) {
      specs[f.key] = f.value;
    }
  });

  return {
    id: String(s.id ?? hit._id),
    title: s.title ?? '',
    titleAr: s.title_l1,
    description: s.description,
    price: priceNum && priceNum > 0 ? priceNum : undefined,
    currency: s.currency ?? 'USD',
    images,
    location,
    category,
    timestamp: s.timestamp ?? 0,
    isElite: s.isElite ?? false,
    isFeatured: s.isFeatured ?? false,
    isFavorite: false,
    specs,
    contactPhone: s.contactPhone ?? s.contactInfo?.phone,
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

  const response = await searchApi.post<MsearchResponse>(
    '/_msearch?filter_path=took%2C*.took%2C*.timed_out%2C*.hits.total.*%2C*.hits.hits._source.*%2C*.hits.hits._score%2C*.error',
    body,
    { headers: { 'Content-Type': 'application/x-ndjson' } },
  );

  const result = response.data.responses?.[0];
  if (!result) {
    return { ads: [], total: 0 };
  }

  const total =
    typeof result.hits.total === 'number'
      ? result.hits.total
      : result.hits.total?.value ?? 0;

  // hits.hits can be undefined when filter_path strips empty arrays
  const ads = (result.hits.hits ?? []).map(normalizeAd);
  return { ads, total };
};

/**
 * Fetches only the total count for a given set of filters (used by "See X Results" CTA).
 */
export const fetchAdsCount = async (filters: SearchFilters): Promise<number> => {
  const query = buildAdsQuery(0, 0, filters);
  const body = buildNdjson(ADS_INDEX, query);

  const response = await searchApi.post<MsearchResponse>('/_msearch?filter_path=took%2C*.took%2C*.timed_out%2C*.hits.total.*%2C*.hits.hits._source.*%2C*.hits.hits._score%2C*.error', body, {
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

  const response = await searchApi.post<MsearchResponse>('/_msearch?filter_path=took%2C*.took%2C*.timed_out%2C*.hits.total.*%2C*.hits.hits._source.*%2C*.hits.hits._score%2C*.error', body, {
    headers: { 'Content-Type': 'application/x-ndjson' },
  });

  const result = response.data.responses?.[0];
  if (!result) {
    return [];
  }

  return (result.hits.hits ?? []).map(hit =>
    normalizeLocation(hit as unknown as { _source: RawLocationSource }),
  );
};
