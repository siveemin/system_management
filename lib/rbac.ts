export type Role = "ADMIN" | "WAREHOUSE_MANAGER" | "SALES_MANAGER" | "STAFF";

export type Permission =
  | "view_dashboard"
  | "manage_warehouses"
  | "view_warehouses"
  | "manage_products"
  | "view_products"
  | "manage_inventory"
  | "view_inventory"
  | "adjust_inventory"
  | "manage_purchase_orders"
  | "view_purchase_orders"
  | "receive_purchase_orders"
  | "manage_sales_orders"
  | "view_sales_orders"
  | "manage_stock_transfers"
  | "view_stock_transfers"
  | "manage_suppliers"
  | "view_suppliers"
  | "manage_customers"
  | "view_customers"
  | "view_low_stock"
  | "view_forecasting"
  | "view_reports"
  | "export_reports"
  | "manage_users"
  | "view_audit_logs"
  | "manage_settings";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "view_dashboard",
    "manage_warehouses",
    "view_warehouses",
    "manage_products",
    "view_products",
    "manage_inventory",
    "view_inventory",
    "adjust_inventory",
    "manage_purchase_orders",
    "view_purchase_orders",
    "receive_purchase_orders",
    "manage_sales_orders",
    "view_sales_orders",
    "manage_stock_transfers",
    "view_stock_transfers",
    "manage_suppliers",
    "view_suppliers",
    "manage_customers",
    "view_customers",
    "view_low_stock",
    "view_forecasting",
    "view_reports",
    "export_reports",
    "manage_users",
    "view_audit_logs",
    "manage_settings",
  ],
  WAREHOUSE_MANAGER: [
    "view_dashboard",
    "manage_warehouses",
    "view_warehouses",
    "manage_products",
    "view_products",
    "manage_inventory",
    "view_inventory",
    "adjust_inventory",
    "manage_purchase_orders",
    "view_purchase_orders",
    "receive_purchase_orders",
    "view_sales_orders",
    "manage_stock_transfers",
    "view_stock_transfers",
    "view_suppliers",
    "view_low_stock",
    "view_forecasting",
    "view_reports",
    "export_reports",
  ],
  SALES_MANAGER: [
    "view_dashboard",
    "view_warehouses",
    "view_products",
    "view_inventory",
    "manage_sales_orders",
    "view_sales_orders",
    "manage_customers",
    "view_customers",
    "view_low_stock",
    "view_forecasting",
    "view_reports",
    "export_reports",
  ],
  STAFF: [
    "view_dashboard",
    "view_warehouses",
    "view_products",
    "view_inventory",
    "view_purchase_orders",
    "view_sales_orders",
    "view_stock_transfers",
    "view_low_stock",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((perm) => hasPermission(role, perm));
}
