'use client';

import { createContext, useContext } from 'react';
import { DEFAULT_LANGUAGE, getTranslations, type Language, type Translations } from '@/utils/i18n';

const LanguageContext = createContext<Language>(DEFAULT_LANGUAGE);

export function LanguageProvider({ lang, children }: { lang: Language; children: React.ReactNode }) {
  return <LanguageContext.Provider value={lang}>{children}</LanguageContext.Provider>;
}

export function useTranslations(): Translations {
  return getTranslations(useContext(LanguageContext));
}
