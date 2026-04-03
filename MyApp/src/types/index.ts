// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  externalID: string;
  name: string;
  nameAr?: string;
  icon?: string;
  iconUrl?: string;
  children?: Category[];
  parentID?: number;
}

export type FieldType = 'select' | 'multiselect' | 'range' | 'dropdown' | 'text' | 'number';

export interface FieldChoice {
  value: string;
  label: string;
  labelAr?: string;
}

export interface CategoryField {
  key: string;
  label: string;
  labelAr?: string;
  fieldType: FieldType;
  choices?: FieldChoice[];
  min?: number;
  max?: number;
  unit?: string;
}

// keyed by category externalID
export type CategoryFieldsMap = Record<string, CategoryField[]>;

// ─── Location ─────────────────────────────────────────────────────────────────

export interface LocationHierarchy {
  externalID: string;
  name: string;
  level: number;
}

export interface Location {
  externalID: string;
  name: string;
  nameAr?: string;
  level: number;
  hierarchy?: LocationHierarchy[];
}

// ─── Ad ───────────────────────────────────────────────────────────────────────

export interface AdImage {
  id: string;
  url: string;
  thumbnail?: string;
}

export interface AdLocation {
  externalID: string;
  name: string;
  nameAr?: string;
  city?: string;
  country?: string;
}

export interface AdCategory {
  externalID: string;
  name: string;
  nameAr?: string;
}

export interface Ad {
  id: string;
  title: string;
  titleAr?: string;
  description?: string;
  price?: number;
  priceFormatted?: string;
  currency?: string;
  images: AdImage[];
  location: AdLocation;
  category: AdCategory;
  timestamp: number;
  isElite?: boolean;
  isFeatured?: boolean;
  isFavorite?: boolean;
  specs?: Record<string, string | number>;
  contactPhone?: string;
}

// ─── Search / Filters ─────────────────────────────────────────────────────────

export interface SearchFilters {
  categoryID?: string;
  locationID?: string;
  locationName?: string;
  priceMin?: number;
  priceMax?: number;
  keyword?: string;
  dynamicFields?: Record<string, string | string[] | number[]>;
  sortBy?: 'newest' | 'price_asc' | 'price_desc';
}

export interface AdSearchParams {
  from: number;
  size: number;
  filters: SearchFilters;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  MainTabs: undefined;
  SearchResults: { query?: string; filters?: SearchFilters };
  SearchFilters: { filters: SearchFilters };
};

export type BottomTabParamList = {
  Home: undefined;
  Chats: undefined;
  Sell: undefined;
  MyAds: undefined;
  Account: undefined;
};
