import { searchApi } from './axiosInstance';
import { Ad, AdImage, AdLocation, AdCategory, Location, SearchFilters } from '../types';

// ─── Indexes ──────────────────────────────────────────────────────────────────

const ADS_INDEX = 'olx-lb-production-ads-en';
const LOCATIONS_INDEX = 'olx-lb-production-locations-en';

// ─── Raw API shapes ───────────────────────────────────────────────────────────

interface RawAdPhoto {
  url?: string;
  thumbnail?: string;
  id?: string | number;
  externalID?: string;
  orderIndex?: number;
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
  // extraFields is a plain object (not array) keyed by attribute name
  extraFields?: Record<string, string | number>;
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

// OLX Lebanon image CDN: https://images.olx.com.lb/thumbnails/{id}-{size}.webp
const buildOlxImageUrl = (id: string | number, size = '600x450'): string =>
  `https://images.olx.com.lb/thumbnails/${id}-${size}.webp`;

// Extracts a plain string URL from whatever the API returns (string or object).
// OLX Elasticsearch photos have no direct `url` — the URL is built from the numeric `id`.
const extractUrl = (val: unknown): string => {
  if (!val) { return ''; }
  if (typeof val === 'string') { return val; }
  if (typeof val === 'object') {
    const v = val as Record<string, unknown>;
    const direct = v.url ?? v.thumbnail ?? v.src ?? v.path ?? '';
    if (typeof direct === 'string' && direct) { return direct; }
    // OLX stores photos as {id, externalID, orderIndex, ...} without a pre-built URL
    if (v.id !== undefined && v.id !== null) {
      return buildOlxImageUrl(v.id as string | number);
    }
  }
  return '';
};

/**
 * Safely coerces a value that may be a string OR a nested OLX location/category
 * object (with keys: id, level, externalID, name, name_l1, slug, slug_l1) into a
 * plain string. Elasticsearch lvl0/lvl1 fields are sometimes indexed as full
 * objects rather than path strings.
 */
const extractString = (val: unknown): string => {
  if (!val) { return ''; }
  if (typeof val === 'string') { return val; }
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    const name = obj.name;
    return typeof name === 'string' ? name : '';
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
    name:
      extractString(locObj?.name) ||
      extractString((s as any)['location.lvl1']) ||
      extractString((s as any)['location.lvl0']),
    nameAr: locObj?.name_l1,
  };

  // ── Category ────────────────────────────────────────────────────────────────
  const catObj = typeof s.category === 'object' ? s.category : null;
  const category: AdCategory = {
    externalID: catObj?.externalID ?? '',
    name:
      extractString(catObj?.name) ||
      extractString((s as any)['category.lvl1']) ||
      extractString((s as any)['category.lvl0']),
    nameAr: catObj?.name_l1,
  };

  // ── Price ───────────────────────────────────────────────────────────────────
  // Top-level `price` is always 0 in OLX's index.
  // The real price lives in extraFields.price (plain object keyed by attribute).
  const extraFieldsObj = s.extraFields ?? {};
  const realPrice = typeof extraFieldsObj.price === 'number' ? extraFieldsObj.price : undefined;

  // ── Specs from formattedExtraFields (array) ─────────────────────────────────
  const specs: Record<string, string | number> = {};
  (s.formattedExtraFields ?? []).forEach((f: { key: string; value: string | number }) => {
    if (f.key && f.value !== undefined) {
      specs[f.key] = f.value;
    }
  });

  return {
    id: String(s.id ?? hit._id),
    title: s.title ?? '',
    titleAr: s.title_l1,
    description: s.description,
    price: realPrice && realPrice > 0 ? realPrice : undefined,
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
        fields: ['title', 'title_l1', 'description'],
        type: 'best_fields',
        fuzziness: 'AUTO',
      },
    });
  }

  // Dynamic fields from categoryFields API — stored in extraFields plain object
  if (filters.dynamicFields) {
    for (const [key, value] of Object.entries(filters.dynamicFields)) {
      if (value === undefined || value === null) { continue; }
      if (Array.isArray(value)) {
        if (value.length === 2 && typeof value[0] === 'number') {
          // Range [min, max]
          must.push({ range: { [`extraFields.${key}`]: { gte: value[0], lte: value[1] } } });
        } else if (value.length > 0) {
          // Multi-select
          must.push({ terms: { [`extraFields.${key}`]: value } });
        }
      } else {
        must.push({ term: { [`extraFields.${key}`]: value } });
      }
    }
  }

  // Price range — real price lives in extraFields.price (top-level `price` is always 0)
  const priceRange: { gte?: number; lte?: number } = {};
  if (filters.priceMin !== undefined) { priceRange.gte = filters.priceMin; }
  if (filters.priceMax !== undefined) { priceRange.lte = filters.priceMax; }
  if (Object.keys(priceRange).length > 0) {
    must.push({ range: { 'extraFields.price': priceRange } });
  }

  // Sort
  let sort: Record<string, SortOrder>[];
  switch (filters.sortBy) {
    case 'price_asc':
      sort = [{ 'extraFields.price': { order: 'asc' } }, { id: { order: 'desc' } }];
      break;
    case 'price_desc':
      sort = [{ 'extraFields.price': { order: 'desc' } }, { id: { order: 'desc' } }];
      break;
    default:
      sort = [{ timestamp: { order: 'desc' } }, { id: { order: 'desc' } }];
  }

  const builtQuery = {
    from,
    size,
    track_total_hits: 200000,
    query: { bool: { must: must.length > 0 ? must : [{ match_all: {} }] } },
    sort,
  };
  return builtQuery;
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
    '/_msearch?filter_path=took%2C*.took%2C*.timed_out%2C*.hits.total.*%2C*.hits.hits._source%2C*.hits.hits._score%2C*.hits.hits._id%2C*.error',
    body,
    { headers: { 'Content-Type': 'application/x-ndjson' } },
  );

  const result = response.data.responses?.[0];
  if (!result) {
    console.warn('[fetchAds] No response in responses[]');
    return { ads: [], total: 0 };
  }

  const total =
    typeof result.hits.total === 'number'
      ? result.hits.total
      : result.hits.total?.value ?? 0;

  // hits.hits can be undefined when filter_path strips empty arrays
  const rawHits = result.hits.hits ?? [];
  const ads = rawHits.map(normalizeAd);
  return { ads, total };
};

/**
 * Fetches only the total count for a given set of filters (used by "See X Results" CTA).
 */
export const fetchAdsCount = async (filters: SearchFilters): Promise<number> => {
  const query = buildAdsQuery(0, 0, filters);
  const body = buildNdjson(ADS_INDEX, query);

  const response = await searchApi.post<MsearchResponse>('/_msearch?filter_path=took%2C*.took%2C*.timed_out%2C*.hits.total.*%2C*.hits.hits._source.*%2C*.hits.hits._score%2C*.hits.hits._id%2C*.error', body, {
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

  const response = await searchApi.post<MsearchResponse>('/_msearch?filter_path=took%2C*.took%2C*.timed_out%2C*.hits.total.*%2C*.hits.hits._source.*%2C*.hits.hits._score%2C*.hits.hits._id%2C*.error', body, {
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
