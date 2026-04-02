import { olxApi } from './axiosInstance';
import { Category, CategoryField, CategoryFieldsMap, FieldType, FieldChoice } from '../types';

// ─── Raw API shapes ───────────────────────────────────────────────────────────

interface RawCategory {
  id: number;
  externalID: string;
  name: string;
  nameAr?: string;
  iconURL?: string;
  icon?: string;
  children?: RawCategory[];
  parentID?: number;
}

interface RawFieldChoice {
  value: string;
  label: string;
  labelAr?: string;
}

interface RawCategoryField {
  key: string;
  label: string;
  labelAr?: string;
  type?: string;
  fieldType?: string;
  choices?: RawFieldChoice[];
  min?: number;
  max?: number;
  unit?: string;
}

// ─── Normalizers ──────────────────────────────────────────────────────────────

const normalizeFieldType = (raw: string | undefined): FieldType => {
  switch (raw) {
    case 'select':
    case 'SELECT':
      return 'select';
    case 'multiselect':
    case 'MULTISELECT':
    case 'multi_select':
      return 'multiselect';
    case 'range':
    case 'RANGE':
      return 'range';
    case 'number':
    case 'NUMBER':
      return 'number';
    case 'text':
    case 'TEXT':
      return 'text';
    default:
      return 'dropdown';
  }
};

const normalizeCategory = (raw: RawCategory): Category => ({
  id: raw.id,
  externalID: raw.externalID,
  name: raw.name,
  nameAr: raw.nameAr,
  iconUrl: raw.iconURL ?? raw.icon,
  parentID: raw.parentID,
  children: raw.children?.map(normalizeCategory) ?? [],
});

const normalizeCategoryField = (raw: RawCategoryField): CategoryField => ({
  key: raw.key,
  label: raw.label,
  labelAr: raw.labelAr,
  fieldType: normalizeFieldType(raw.fieldType ?? raw.type),
  choices: raw.choices?.map(
    (c): FieldChoice => ({
      value: c.value,
      label: c.label,
      labelAr: c.labelAr,
    }),
  ),
  min: raw.min,
  max: raw.max,
  unit: raw.unit,
});

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * Fetches the full category tree from OLX Lebanon.
 */
export const fetchCategories = async (): Promise<Category[]> => {
  const response = await olxApi.get<{ data: RawCategory[] } | RawCategory[]>('/categories');
  const raw = Array.isArray(response.data)
    ? response.data
    : (response.data as { data: RawCategory[] }).data ?? [];
  return raw.map(normalizeCategory);
};

/**
 * Fetches all category fields keyed by category externalID.
 * Used to render dynamic filters per category.
 */
export const fetchCategoryFields = async (): Promise<CategoryFieldsMap> => {
  const response = await olxApi.get<Record<string, RawCategoryField[]>>(
    '/categoryFields?includeChildCategories=true&splitByCategoryIDs=true&flatChoices=true&groupChoicesBySection=true&flat=true',
  );

  const result: CategoryFieldsMap = {};
  for (const [categoryID, fields] of Object.entries(response.data)) {
    if (Array.isArray(fields)) {
      result[categoryID] = fields.map(normalizeCategoryField);
    }
  }
  return result;
};
