import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { I18nManager } from 'react-native';
import i18n, { storeLanguage, Language } from '../i18n';
import { SearchFilters, Category, CategoryFieldsMap } from '../types';

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AppState {
  language: Language;
  isRTL: boolean;
  activeFilters: SearchFilters;
  categories: Category[];
  categoryFieldsMap: CategoryFieldsMap;
  isCategoriesLoaded: boolean;
}

interface AppActions {
  setLanguage: (lang: Language) => Promise<void>;
  setActiveFilters: (filters: SearchFilters) => void;
  updateActiveFilters: (partial: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  setCategories: (categories: Category[]) => void;
  setCategoryFieldsMap: (map: CategoryFieldsMap) => void;
}

type AppContextType = AppState & AppActions;

// ─── Default values ───────────────────────────────────────────────────────────

const defaultFilters: SearchFilters = {
  sortBy: 'newest',
};

const AppContext = createContext<AppContextType>({} as AppContextType);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface AppProviderProps {
  children: ReactNode;
  initialLanguage?: Language;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children, initialLanguage = 'en' }) => {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const [isRTL, setIsRTL] = useState(initialLanguage === 'ar');
  const [activeFilters, setActiveFiltersState] = useState<SearchFilters>(defaultFilters);
  const [categories, setCategoriesState] = useState<Category[]>([]);
  const [categoryFieldsMap, setCategoryFieldsMapState] = useState<CategoryFieldsMap>({});
  const [isCategoriesLoaded, setIsCategoriesLoaded] = useState(false);

  const setLanguage = useCallback(async (lang: Language) => {
    await storeLanguage(lang);
    await i18n.changeLanguage(lang);
    setLanguageState(lang);
    const rtl = lang === 'ar';
    setIsRTL(rtl);
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
    // Note: RTL layout changes require an app restart to take full effect
  }, []);

  const setActiveFilters = useCallback((filters: SearchFilters) => {
    setActiveFiltersState(filters);
  }, []);

  const updateActiveFilters = useCallback((partial: Partial<SearchFilters>) => {
    setActiveFiltersState(prev => ({ ...prev, ...partial }));
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFiltersState(defaultFilters);
  }, []);

  const setCategories = useCallback((cats: Category[]) => {
    setCategoriesState(cats);
    setIsCategoriesLoaded(true);
  }, []);

  const setCategoryFieldsMap = useCallback((map: CategoryFieldsMap) => {
    setCategoryFieldsMapState(map);
  }, []);

  return (
    <AppContext.Provider
      value={{
        language,
        isRTL,
        activeFilters,
        categories,
        categoryFieldsMap,
        isCategoriesLoaded,
        setLanguage,
        setActiveFilters,
        updateActiveFilters,
        clearFilters,
        setCategories,
        setCategoryFieldsMap,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
