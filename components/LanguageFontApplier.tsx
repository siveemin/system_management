"use client";

import { useEffect } from "react";
import dataStore from "@/lib/store";

export function LanguageFontApplier() {
  useEffect(() => {
    const apply = () => {
      const isKhmer = dataStore.getLanguage() === "km";
      document.documentElement.classList.toggle("lang-km", isKhmer);
    };
    apply();
    return dataStore.subscribe(apply);
  }, []);

  return null;
}
