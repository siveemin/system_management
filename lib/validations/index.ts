import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  sku: z.string().min(2, "SKU is required"),
  barcode: z.string().optional().nullable(),
  qrCode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  uom: z.string().default("pcs"),
  costPrice: z.coerce.number().min(0, "Cost price must be positive"),
  sellingPrice: z.coerce.number().min(0, "Selling price must be positive"),
  minStockLevel: z.coerce.number().int().min(0, "Minimum stock must be 0 or higher"),
  maxStockLevel: z.coerce.number().int().min(0).optional().nullable(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const warehouseSchema = z.object({
  name: z.string().min(2, "Warehouse name is required"),
  code: z.string().min(2, "Warehouse code is required (e.g. WH-NORTH)"),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  managerName: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const supplierSchema = z.object({
  name: z.string().min(2, "Supplier name is required"),
  contactPerson: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const customerSchema = z.object({
  name: z.string().min(2, "Customer name is required"),
  contactPerson: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  type: z.enum(["ADJUSTMENT_INCREASE", "ADJUSTMENT_DECREASE", "STOCK_IN", "STOCK_OUT"]),
  quantity: z.coerce.number().int().positive("Quantity must be greater than 0"),
  notes: z.string().min(3, "Please provide a reason / note for this adjustment"),
});

export const purchaseOrderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().int().positive("Quantity must be > 0"),
  unitCost: z.coerce.number().min(0, "Cost must be >= 0"),
});

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  orderDate: z.string().optional(),
  expectedDeliveryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(purchaseOrderItemSchema).min(1, "At least one item is required"),
});

export const salesOrderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().int().positive("Quantity must be > 0"),
  unitPrice: z.coerce.number().min(0, "Unit price must be >= 0"),
});

export const salesOrderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  orderDate: z.string().optional(),
  deliveryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  items: z.array(salesOrderItemSchema).min(1, "At least one item is required"),
});

export const stockTransferItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  requestedQuantity: z.coerce.number().int().positive("Quantity must be > 0"),
});

export const stockTransferSchema = z.object({
  sourceWarehouseId: z.string().min(1, "Source warehouse is required"),
  destinationWarehouseId: z.string().min(1, "Destination warehouse is required"),
  notes: z.string().optional().nullable(),
  items: z.array(stockTransferItemSchema).min(1, "At least one item is required"),
}).refine((data) => data.sourceWarehouseId !== data.destinationWarehouseId, {
  message: "Source and Destination warehouse cannot be the same",
  path: ["destinationWarehouseId"],
});
