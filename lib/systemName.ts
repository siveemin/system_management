const KEY = "system_name";
const DEFAULT = "Smart Inventory";

export function getSystemName(): string {
  if (typeof window === "undefined") return DEFAULT;
  return localStorage.getItem(KEY) || DEFAULT;
}

export function setSystemName(name: string) {
  localStorage.setItem(KEY, name.trim() || DEFAULT);
  window.dispatchEvent(new Event("system_name_changed"));
}
