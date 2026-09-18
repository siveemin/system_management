"use client";
import { useEffect } from "react";
import dataStore from "@/lib/store";

export function StoreHydrator() {
  useEffect(() => {
    dataStore.hydrateFromLocalStorage();
  }, []);
  return null;
}
