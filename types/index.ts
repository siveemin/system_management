export type Role = "ADMIN" | "WAREHOUSE_MANAGER" | "SALES_MANAGER" | "STAFF";
export type EntityStatus = "ACTIVE" | "INACTIVE";

export type TransactionType =
  | "STOCK_IN"
  | "STOCK_OUT"
  | "PURCHASE_RECEIVE"
  | "SALE"
  | "TRANSFER_OUT"
  | "TRANSFER_IN"
  | "ADJUSTMENT_INCREASE"
  | "ADJUSTMENT_DECREASE"
  | "RETURN";

export type ReferenceType =
  | "PURCHASE_ORDER"
  | "SALES_ORDER"
  | "STOCK_TRANSFER"
  | "MANUAL_ADJUSTMENT"
  | "INITIAL_COUNT"
  | "RETURN";

export type PurchaseOrderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

export type SalesOrderStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

export type StockTransferStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "IN_TRANSIT"
  | "RECEIVED"
  | "CANCELLED";

export type AlertStatus = "NEW" | "VIEWED" | "RESOLVED";

export type NotificationType =
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "PURCHASE_ORDER"
  | "SALES_ORDER"
  | "STOCK_TRANSFER"
  | "SYSTEM";

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  phone?: string | null;
  status: EntityStatus;
  warehouseId?: string | null;
  warehouseName?: string | null;
  createdAt: string;
}

export interface WarehouseDTO {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  managerName?: string | null;
  status: EntityStatus;
  totalProductsCount?: number;
  totalInventoryValue?: number;
  lowStockItemsCount?: number;
  createdAt: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  productCount?: number;
}

export interface SupplierDTO {
  id: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  status: EntityStatus;
  notes?: string | null;
  totalPurchased?: number;
  purchaseOrdersCount?: number;
  createdAt: string;
}

export interface CustomerDTO {
  id: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  status: EntityStatus;
  notes?: string | null;
  totalSpent?: number;
  salesOrdersCount?: number;
  createdAt: string;
}

export interface ProductInventoryDTO {
  id: string;
  productId: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  locationBin?: string | null;
  updatedAt: string;
}

export interface ProductDTO {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  qrCode?: string | null;
  description?: string | null;
  uom: string;
  costPrice: number;
  sellingPrice: number;
  minStockLevel: number;
  maxStockLevel?: number | null;
  imageUrl?: string | null;
  status: EntityStatus;
  categoryId?: string | null;
  categoryName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  totalStock: number;
  totalReserved: number;
  totalAvailable: number;
  inventories?: ProductInventoryDTO[];
  createdAt: string;
}

export interface InventoryTransactionDTO {
  id: string;
  transactionNumber: string;
  productId: string;
  productName: string;
  productSku: string;
  warehouseId: string;
  warehouseName: string;
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  type: TransactionType;
  referenceId?: string | null;
  referenceType: ReferenceType;
  userId?: string | null;
  userName?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface PurchaseOrderItemDTO {
  id: string;
  purchaseOrderId: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrderDTO {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  orderDate: string;
  expectedDeliveryDate?: string | null;
  status: PurchaseOrderStatus;
  totalAmount: number;
  notes?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  items: PurchaseOrderItemDTO[];
  createdAt: string;
}

export interface SalesOrderItemDTO {
  id: string;
  salesOrderId: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface SalesOrderDTO {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  warehouseName: string;
  orderDate: string;
  deliveryDate?: string | null;
  status: SalesOrderStatus;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  notes?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  items: SalesOrderItemDTO[];
  createdAt: string;
}

export interface StockTransferItemDTO {
  id: string;
  stockTransferId: string;
  productId: string;
  productName: string;
  productSku: string;
  requestedQuantity: number;
  sentQuantity: number;
  receivedQuantity: number;
}

export interface StockTransferDTO {
  id: string;
  transferNumber: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  status: StockTransferStatus;
  requestedById?: string | null;
  requestedByName?: string | null;
  sentById?: string | null;
  sentByName?: string | null;
  receivedById?: string | null;
  receivedByName?: string | null;
  sentDate?: string | null;
  receivedDate?: string | null;
  notes?: string | null;
  items: StockTransferItemDTO[];
  createdAt: string;
}

export interface LowStockAlertDTO {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  barcode?: string | null;
  warehouseId: string;
  warehouseName: string;
  currentQuantity: number;
  minStockLevel: number;
  shortageQuantity: number;
  status: AlertStatus;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  read: boolean;
  userId?: string | null;
  createdAt: string;
}

export interface ForecastDTO {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  calculatedAt: string;
  dailyAvgSales: number;
  predictedDemand7d: number;
  predictedDemand30d: number;
  currentStock: number;
  estimatedDaysRemaining: number;
  recommendedReorderQty: number;
  historicalSalesTrend: { date: string; quantity: number }[];
  projectedSalesTrend: { date: string; quantity: number }[];
  notes?: string | null;
}

export interface AuditLogDTO {
  id: string;
  userId?: string | null;
  userName?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  description: string;
  metadata?: string | null;
  createdAt: string;
}

export interface DashboardKPIDTO {
  totalInventoryValue: number;
  totalProducts: number;
  totalWarehouses: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  pendingPurchaseOrders: number;
  pendingSalesOrders: number;
  pendingStockTransfers: number;
}
