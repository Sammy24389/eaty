"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Locale, locales, translations, TranslationKey } from "@/lib/i18n/translations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved && translations[saved]) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
    document.documentElement.dir = locales.find((l) => l.code === newLocale)?.dir || "ltr";
    document.documentElement.lang = newLocale;
  }, []);

  const translate = useCallback(
    (key: TranslationKey) => {
      return translations[locale]?.[key] || translations.en[key] || key;
    },
    [locale]
  );

  const dir = locales.find((l) => l.code === locale)?.dir || "ltr";

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: translate, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
