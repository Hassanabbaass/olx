import { olxApi } from './axiosInstance';
import { Category, CategoryField, CategoryFieldsMap, FieldType, FieldChoice } from '../types';

// ─── Raw API shapes ───────────────────────────────────────────────────────────

interface RawCategory {
  id: number;
  externalID: string;
  name: string;
  name_l1?: string;   // Arabic name returned by OLX API
  nameAr?: string;
  iconURL?: string;
  icon?: string;
  children?: RawCategory[];
  parentID?: number | null;
}

interface RawFieldChoice {
  value: string;
  label: string;
  label_l1?: string;  // Arabic label
  labelAr?: string;
}

// Actual shape returned by OLX categoryFields API:
// { [categoryInternalID]: { flatFields: RawCategoryField[] } }
interface RawCategoryField {
  id: number;
  attribute: string;   // field key, e.g. "brand", "color", "price"
  name: string;        // English label
  name_l1?: string;   // Arabic label
  filterType: string;  // "range", "select", "multiselect", etc.
  valueType?: string;  // "float", "string", etc.
  minValue?: number | null;
  maxValue?: number | null;
  choices?: RawFieldChoice[];
  values?: RawFieldChoice[];
  unit?: string;
  state?: string;
}

interface RawCategoryFieldEntry {
  flatFields: RawCategoryField[];
}

// ─── Normalizers ──────────────────────────────────────────────────────────────

const normalizeFieldType = (raw: string | undefined): FieldType => {
  switch ((raw ?? '').toLowerCase()) {
    case 'select':      return 'select';
    case 'multiselect':
    case 'multi_select': return 'multiselect';
    case 'range':       return 'range';
    case 'number':      return 'number';
    case 'text':        return 'text';
    default:            return 'dropdown';
  }
};

const normalizeCategory = (raw: RawCategory): Category => ({
  id: raw.id,
  externalID: raw.externalID,
  name: raw.name,
  nameAr: raw.name_l1 ?? raw.nameAr,
  iconUrl: raw.iconURL ?? raw.icon,
  parentID: raw.parentID ?? undefined,
  children: raw.children?.map(normalizeCategory) ?? [],
});

const normalizeCategoryField = (raw: RawCategoryField): CategoryField => {
  const rawChoices = raw.choices ?? raw.values ?? [];
  return {
    key: raw.attribute,
    label: raw.name,
    labelAr: raw.name_l1,
    fieldType: normalizeFieldType(raw.filterType),
    choices: rawChoices.map(
      (c): FieldChoice => ({
        value: c.value,
        label: c.label,
        labelAr: c.label_l1 ?? c.labelAr,
      }),
    ),
    min: raw.minValue ?? undefined,
    max: raw.maxValue ?? undefined,
    unit: raw.unit,
  };
};

/**
 * Recursively builds a map of { externalID → CategoryField[] }
 * using the category tree to translate internal IDs to externalIDs.
 */
const buildExternalIDFieldsMap = (
  categories: Category[],
  rawMap: Record<string, RawCategoryField[]>,
): CategoryFieldsMap => {
  const result: CategoryFieldsMap = {};
  const traverse = (cat: Category) => {
    const fields = rawMap[String(cat.id)];
    if (fields && fields.length > 0) {
      result[cat.externalID] = fields.map(normalizeCategoryField);
    }
    cat.children?.forEach(traverse);
  };
  categories.forEach(traverse);
  return result;
};

// ─── API Calls ────────────────────────────────────────────────────────────────

export const fetchCategories = async (): Promise<Category[]> => {
  const response = await olxApi.get<{ data: RawCategory[] } | RawCategory[]>('/categories');
  const raw = Array.isArray(response.data)
    ? response.data
    : (response.data as { data: RawCategory[] }).data ?? [];
  return raw.map(normalizeCategory);
};

/**
 * Fetches all category fields and returns them keyed by category externalID.
 * Requires the category tree to map internal IDs → externalIDs.
 */
export const fetchCategoryFields = async (
  categories: Category[],
): Promise<CategoryFieldsMap> => {
  const response = await olxApi.get<Record<string, RawCategoryFieldEntry>>(
    '/categoryFields?includeChildCategories=true&splitByCategoryIDs=true&flatChoices=true&groupChoicesBySection=true&flat=true',
  );

  // Each value is { flatFields: [...] }, not a direct array
  const rawMap: Record<string, RawCategoryField[]> = {};
  for (const [id, entry] of Object.entries(response.data)) {
    if (entry && Array.isArray(entry.flatFields)) {
      rawMap[id] = entry.flatFields.filter(f => f.state === 'active');
    }
  }

  return buildExternalIDFieldsMap(categories, rawMap);
};
