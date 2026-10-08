const KEY_NAME = "system_name";
const KEY_SUB  = "system_subtitle";
const DEFAULT_NAME = "Smart Inventory";
const DEFAULT_SUB  = "Warehouse Management";

export function getSystemName(): string {
  if (typeof window === "undefined") return DEFAULT_NAME;
  return localStorage.getItem(KEY_NAME) || DEFAULT_NAME;
}

export function setSystemName(name: string) {
  localStorage.setItem(KEY_NAME, name.trim() || DEFAULT_NAME);
  window.dispatchEvent(new Event("system_name_changed"));
}

export function getSystemSubtitle(): string {
  if (typeof window === "undefined") return DEFAULT_SUB;
  return localStorage.getItem(KEY_SUB) || DEFAULT_SUB;
}

export function setSystemSubtitle(sub: string) {
  localStorage.setItem(KEY_SUB, sub.trim() || DEFAULT_SUB);
  window.dispatchEvent(new Event("system_name_changed"));
}
