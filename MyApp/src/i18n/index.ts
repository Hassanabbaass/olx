import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import ar from './ar.json';

const LANGUAGE_KEY = '@olx_language';

export const LANGUAGES = {
  en: 'en',
  ar: 'ar',
} as const;

export type Language = keyof typeof LANGUAGES;

export const getStoredLanguage = async (): Promise<Language> => {
  try {
    const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
    return (lang as Language) ?? 'en';
  } catch {
    return 'en';
  }
};

export const storeLanguage = async (lang: Language): Promise<void> => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
};

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
