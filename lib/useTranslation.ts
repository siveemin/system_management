"use client";
import { useState, useEffect } from "react";
import dataStore from "./store";
import { getTranslations, TranslationKey, Language } from "./i18n";

export function useTranslation() {
  // A single counter forces a re-render whenever the store notifies.
  // We then read lang + translations fresh from the store every render,
  // so there is no two-variable sync problem.
  const [, setTick] = useState(0);

  useEffect(() => {
    return dataStore.subscribe(() => setTick((n) => n + 1));
  }, []);

  const lang: Language = dataStore.getLanguage();
  const translations = getTranslations(lang);

  const t = (key: TranslationKey): string =>
    (translations[key] as string) ?? key;

  return { t, lang };
}
