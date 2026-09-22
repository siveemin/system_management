import {
  UserDTO,
  WarehouseDTO,
  CategoryDTO,
  SupplierDTO,
  CustomerDTO,
  ProductDTO,
  InventoryTransactionDTO,
  PurchaseOrderDTO,
  SalesOrderDTO,
  StockTransferDTO,
  LowStockAlertDTO,
  NotificationDTO,
  ForecastDTO,
  AuditLogDTO,
  TransactionType,
  Role,
} from "@/types";
import {
  INITIAL_USERS,
  INITIAL_WAREHOUSES,
  INITIAL_CATEGORIES,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_TRANSACTIONS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_SALES_ORDERS,
  INITIAL_TRANSFERS,
  INITIAL_ALERTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_FORECASTS,
  INITIAL_AUDIT_LOGS,
} from "./mock-data";
import { generateOrderNumber, CurrencyCode } from "./utils";
import { Language, setActiveLanguage } from "./i18n";

class InventoryDataStore {
  private users: UserDTO[] = [...INITIAL_USERS];
  private warehouses: WarehouseDTO[] = [...INITIAL_WAREHOUSES];
  private categories: CategoryDTO[] = [...INITIAL_CATEGORIES];
  private suppliers: SupplierDTO[] = [...INITIAL_SUPPLIERS];
  private customers: CustomerDTO[] = [...INITIAL_CUSTOMERS];
  private products: ProductDTO[] = [...INITIAL_PRODUCTS];
  private transactions: InventoryTransactionDTO[] = [...INITIAL_TRANSACTIONS];
  private purchaseOrders: PurchaseOrderDTO[] = [...INITIAL_PURCHASE_ORDERS];
  private salesOrders: SalesOrderDTO[] = [...INITIAL_SALES_ORDERS];
  private stockTransfers: StockTransferDTO[] = [...INITIAL_TRANSFERS];
  private alerts: LowStockAlertDTO[] = [...INITIAL_ALERTS];
  private notifications: NotificationDTO[] = [...INITIAL_NOTIFICATIONS];
  private forecasts: ForecastDTO[] = [...INITIAL_FORECASTS];
  private auditLogs: AuditLogDTO[] = [...INITIAL_AUDIT_LOGS];

  private currentUser: UserDTO = INITIAL_USERS[0]; // Default: Alexander Vance (ADMIN)
  private currentWarehouseId: string = "wh-1"; // Default: Main Distribution Center
  private currency: CurrencyCode = "USD";
  private language: Language = "en";
  private listeners: Set<() => void> = new Set();
  private hydrated = false;

  constructor() {
    // Do NOT load localStorage here — the constructor runs during SSR too.
    // Hydration happens client-side via hydrateFromLocalStorage() called in useEffect.
  }

  public hydrateFromLocalStorage() {
    if (this.hydrated || typeof window === "undefined") return;
    this.hydrated = true;
    this.loadFromLocalStorage();
    this.notify();
  }

  private saveToLocalStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("smart_inventory_state", JSON.stringify({
        users: this.users,
        warehouses: this.warehouses,
        categories: this.categories,
        suppliers: this.suppliers,
        customers: this.customers,
        products: this.products,
        transactions: this.transactions,
        purchaseOrders: this.purchaseOrders,
        salesOrders: this.salesOrders,
        stockTransfers: this.stockTransfers,
        alerts: this.alerts,
        notifications: this.notifications,
        forecasts: this.forecasts,
        auditLogs: this.auditLogs,
        currentUserId: this.currentUser.id,
        currentWarehouseId: this.currentWarehouseId,
        currency: this.currency,
        language: this.language,
      }));
    } catch {
      // Ignore storage limit issues in demo mode
    }
  }

  private loadFromLocalStorage() {
    if (typeof window === "undefined") return;
    try {
      const data = localStorage.getItem("smart_inventory_state");
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.users) this.users = parsed.users;
        if (parsed.warehouses) this.warehouses = parsed.warehouses;
        if (parsed.categories) this.categories = parsed.categories;
        if (parsed.suppliers) this.suppliers = parsed.suppliers;
        if (parsed.customers) this.customers = parsed.customers;
        if (parsed.products) this.products = parsed.products;
        if (parsed.transactions) this.transactions = parsed.transactions;
        if (parsed.purchaseOrders) this.purchaseOrders = parsed.purchaseOrders;
        if (parsed.salesOrders) this.salesOrders = parsed.salesOrders;
        if (parsed.stockTransfers) this.stockTransfers = parsed.stockTransfers;
        if (parsed.alerts) this.alerts = parsed.alerts;
        if (parsed.notifications) this.notifications = parsed.notifications;
        if (parsed.forecasts) this.forecasts = parsed.forecasts;
        if (parsed.auditLogs) this.auditLogs = parsed.auditLogs;
        if (parsed.currentUserId) {
          const user = this.users.find((u) => u.id === parsed.currentUserId);
          if (user) this.currentUser = user;
        }
        if (parsed.currentWarehouseId) {
          this.currentWarehouseId = parsed.currentWarehouseId;
        }
        if (parsed.currency) {
          this.currency = parsed.currency;
          localStorage.setItem("smart_inventory_currency", parsed.currency);
        }
        if (parsed.language) {
          this.language = parsed.language;
          setActiveLanguage(parsed.language);
        }
      }
    } catch {
      // LocalStorage fallback
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.saveToLocalStorage();
    this.listeners.forEach((listener) => listener());
  }

  // --- Auth & Context Switcher ---
  public getCurrentUser(): UserDTO {
    return this.currentUser;
  }

  public setCurrentUser(userId: string) {
    const u = this.users.find((user) => user.id === userId);
    if (u) {
      this.currentUser = u;
      this.notify();
    }
  }

  public getCurrentWarehouseId(): string {
    return this.currentWarehouseId;
  }

  public setCurrentWarehouseId(warehouseId: string) {
    this.currentWarehouseId = warehouseId;
    this.notify();
  }

  // --- Currency ---
  public getCurrency(): CurrencyCode {
    return this.currency;
  }

  public setCurrency(currency: CurrencyCode) {
    this.currency = currency;
    if (typeof window !== "undefined") {
      localStorage.setItem("smart_inventory_currency", currency);
    }
    this.notify();
  }

  // --- Language ---
  public getLanguage(): Language {
    return this.language;
  }

  public setLanguage(lang: Language) {
    this.language = lang;
    setActiveLanguage(lang);
    this.notify();
  }

  // --- Products ---
  public getProducts(): ProductDTO[] {
    return [...this.products];
  }

  public getProductById(id: string): ProductDTO | undefined {
    return this.products.find((p) => p.id === id);
  }

  public getProductByBarcodeOrSKU(code: string): ProductDTO | undefined {
    const clean = code.trim().toUpperCase();

    // QR codes on printed labels encode as "PROD:SKU:BARCODE"
    if (clean.startsWith("PROD:")) {
      const parts = clean.split(":");
      const skuFromQR = parts[1];
      const barcodeFromQR = parts[2];
      return this.products.find(
        (p) =>
          p.sku.toUpperCase() === skuFromQR ||
          (barcodeFromQR && p.barcode && p.barcode.toUpperCase() === barcodeFromQR)
      );
    }

    return this.products.find(
      (p) =>
        p.sku.trim().toUpperCase() === clean ||
        (p.barcode && p.barcode.trim().toUpperCase() === clean) ||
        (p.qrCode && p.qrCode.trim().toUpperCase().includes(clean))
    );
  }

  public createProduct(data: Omit<ProductDTO, "id" | "totalStock" | "totalReserved" | "totalAvailable" | "createdAt" | "inventories"> & { initialStockPerWarehouse?: Record<string, number> }): ProductDTO {
    const id = `prod-${Date.now()}`;
    const inventories = this.warehouses.map((w) => {
      const qty = data.initialStockPerWarehouse?.[w.id] || 0;
      return {
        id: `pi-${Date.now()}-${w.id}`,
        productId: id,
        warehouseId: w.id,
        warehouseName: w.name,
        warehouseCode: w.code,
        quantity: qty,
        reservedQuantity: 0,
        availableQuantity: qty,
        locationBin: "Aisle A-01-A1",
        updatedAt: new Date().toISOString(),
      };
    });

    const totalStock = inventories.reduce((acc, i) => acc + i.quantity, 0);

    const newProduct: ProductDTO = {
      ...data,
      id,
      qrCode: data.qrCode ?? `PROD:${data.sku}:${data.barcode || ""}`,
      totalStock,
      totalReserved: 0,
      totalAvailable: totalStock,
      inventories,
      createdAt: new Date().toISOString(),
    };

    this.products.unshift(newProduct);

    // If initial stock was provided, create initial count transaction
    inventories.forEach((inv) => {
      if (inv.quantity > 0) {
        this.createTransaction({
          productId: id,
          productName: newProduct.name,
          productSku: newProduct.sku,
          warehouseId: inv.warehouseId,
          warehouseName: inv.warehouseName,
          quantityBefore: 0,
          quantityChange: inv.quantity,
          quantityAfter: inv.quantity,
          type: "STOCK_IN",
          referenceId: null,
          referenceType: "INITIAL_COUNT",
          notes: "Initial inventory setup",
        });
      }
    });

    this.logAudit({
      action: "CREATE_PRODUCT",
      resourceType: "PRODUCT",
      resourceId: id,
      description: `Created product ${newProduct.name} (${newProduct.sku})`,
    });

    this.checkLowStockAlert(newProduct);
    this.notify();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<ProductDTO>): ProductDTO | undefined {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    const old = this.products[index];
    const updated: ProductDTO = {
      ...old,
      ...updates,
    };

    this.products[index] = updated;
    this.logAudit({
      action: "UPDATE_PRODUCT",
      resourceType: "PRODUCT",
      resourceId: id,
      description: `Updated product details for ${updated.name}`,
    });

    this.checkLowStockAlert(updated);
    this.notify();
    return updated;
  }

  // --- Atomic Inventory Movements & Ledger ---
  public adjustStock(params: {
    productId: string;
    warehouseId: string;
    quantityChange: number; // positive or negative
    type: TransactionType;
    referenceId?: string | null;
    referenceType?: any;
    notes?: string;
  }): { success: boolean; error?: string; transaction?: InventoryTransactionDTO } {
    const product = this.products.find((p) => p.id === params.productId);
    if (!product) return { success: false, error: "Product not found" };

    const warehouse = this.warehouses.find((w) => w.id === params.warehouseId);
    if (!warehouse) return { success: false, error: "Warehouse not found" };

    if (!product.inventories) product.inventories = [];
    let inventory = product.inventories.find((i) => i.warehouseId === params.warehouseId);

    if (!inventory) {
      inventory = {
        id: `pi-${Date.now()}-${warehouse.id}`,
        productId: product.id,
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        warehouseCode: warehouse.code,
        quantity: 0,
        reservedQuantity: 0,
        availableQuantity: 0,
        updatedAt: new Date().toISOString(),
      };
      product.inventories.push(inventory);
    }

    const qtyBefore = inventory.quantity;
    const qtyAfter = qtyBefore + params.quantityChange;

    if (qtyAfter < 0) {
      return { success: false, error: `Insufficient stock in ${warehouse.name}. Available: ${qtyBefore}, Requested change: ${params.quantityChange}` };
    }

    // Atomic mutation
    inventory.quantity = qtyAfter;
    inventory.availableQuantity = Math.max(0, inventory.quantity - inventory.reservedQuantity);
    inventory.updatedAt = new Date().toISOString();

    product.totalStock = product.inventories.reduce((sum, i) => sum + i.quantity, 0);
    product.totalReserved = product.inventories.reduce((sum, i) => sum + i.reservedQuantity, 0);
    product.totalAvailable = Math.max(0, product.totalStock - product.totalReserved);

    // Record immutable ledger transaction
    const transaction = this.createTransaction({
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      quantityBefore: qtyBefore,
      quantityChange: params.quantityChange,
      quantityAfter: qtyAfter,
      type: params.type,
      referenceId: params.referenceId || null,
      referenceType: params.referenceType || "MANUAL_ADJUSTMENT",
      notes: params.notes || "Stock adjustment",
    });

    this.logAudit({
      action: "ADJUST_INVENTORY",
      resourceType: "PRODUCT",
      resourceId: product.id,
      description: `Adjusted stock for ${product.name} in ${warehouse.name} by ${params.quantityChange > 0 ? `+${params.quantityChange}` : params.quantityChange} units`,
    });

    this.checkLowStockAlert(product);
    this.notify();
    return { success: true, transaction };
  }

  private createTransaction(data: Omit<InventoryTransactionDTO, "id" | "transactionNumber" | "userId" | "userName" | "createdAt">): InventoryTransactionDTO {
    const txn: InventoryTransactionDTO = {
      ...data,
      id: `txn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      transactionNumber: generateOrderNumber("TXN"),
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      createdAt: new Date().toISOString(),
    };
    this.transactions.unshift(txn);
    return txn;
  }

  // --- Purchase Orders ---
  public getPurchaseOrders(): PurchaseOrderDTO[] {
    return [...this.purchaseOrders];
  }

  public createPurchaseOrder(data: {
    supplierId: string;
    warehouseId: string;
    expectedDeliveryDate?: string | null;
    notes?: string | null;
    items: { productId: string; quantity: number; unitCost: number }[];
  }): PurchaseOrderDTO {
    const supplier = this.suppliers.find((s) => s.id === data.supplierId);
    const warehouse = this.warehouses.find((w) => w.id === data.warehouseId);

    const items = data.items.map((item) => {
      const prod = this.products.find((p) => p.id === item.productId);
      return {
        id: `poi-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        purchaseOrderId: "",
        productId: item.productId,
        productName: prod ? prod.name : "Product",
        productSku: prod ? prod.sku : "",
        quantity: item.quantity,
        receivedQuantity: 0,
        unitCost: item.unitCost,
        totalCost: item.quantity * item.unitCost,
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);
    const id = `po-${Date.now()}`;
    const poNumber = generateOrderNumber("PO");

    items.forEach((i) => (i.purchaseOrderId = id));

    const newPO: PurchaseOrderDTO = {
      id,
      orderNumber: poNumber,
      supplierId: data.supplierId,
      supplierName: supplier ? supplier.name : "Supplier",
      warehouseId: data.warehouseId,
      warehouseName: warehouse ? warehouse.name : "Warehouse",
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: data.expectedDeliveryDate || null,
      status: "DRAFT",
      totalAmount,
      notes: data.notes || null,
      createdById: this.currentUser.id,
      createdByName: this.currentUser.name,
      items,
      createdAt: new Date().toISOString(),
    };

    this.purchaseOrders.unshift(newPO);
    this.logAudit({
      action: "CREATE_PURCHASE_ORDER",
      resourceType: "PURCHASE_ORDER",
      resourceId: id,
      description: `Created Purchase Order ${poNumber} for ${supplier?.name} (${items.length} items, $${totalAmount.toFixed(2)})`,
    });

    this.notify();
    return newPO;
  }

  public updatePurchaseOrderStatus(poId: string, status: PurchaseOrderDTO["status"]): boolean {
    const po = this.purchaseOrders.find((p) => p.id === poId);
    if (!po) return false;

    po.status = status;
    this.logAudit({
      action: "UPDATE_PURCHASE_ORDER_STATUS",
      resourceType: "PURCHASE_ORDER",
      resourceId: poId,
      description: `Changed PO ${po.orderNumber} status to ${status}`,
    });

    this.notify();
    return true;
  }

  public receivePurchaseOrderItems(poId: string, receivedMap: Record<string, number>): { success: boolean; error?: string } {
    const po = this.purchaseOrders.find((p) => p.id === poId);
    if (!po) return { success: false, error: "Purchase Order not found" };

    if (po.status === "RECEIVED" || po.status === "CANCELLED") {
      return { success: false, error: `Cannot receive PO in status ${po.status}` };
    }

    // Process receiving for each item
    for (const item of po.items) {
      const receivingQty = receivedMap[item.id] || 0;
      if (receivingQty > 0) {
        const remainingToReceive = item.quantity - item.receivedQuantity;
        if (receivingQty > remainingToReceive) {
          return { success: false, error: `Cannot receive ${receivingQty} for ${item.productName}. Max remaining is ${remainingToReceive}` };
        }

        item.receivedQuantity += receivingQty;

        // Atomically increase stock in target warehouse
        this.adjustStock({
          productId: item.productId,
          warehouseId: po.warehouseId,
          quantityChange: receivingQty,
          type: "PURCHASE_RECEIVE",
          referenceId: po.id,
          referenceType: "PURCHASE_ORDER",
          notes: `Received from Purchase Order ${po.orderNumber}`,
        });
      }
    }

    // Update PO status automatically
    const allReceived = po.items.every((i) => i.receivedQuantity >= i.quantity);
    const anyReceived = po.items.some((i) => i.receivedQuantity > 0);

    if (allReceived) {
      po.status = "RECEIVED";
    } else if (anyReceived) {
      po.status = "PARTIALLY_RECEIVED";
    }

    this.logAudit({
      action: "RECEIVE_PURCHASE_ORDER",
      resourceType: "PURCHASE_ORDER",
      resourceId: po.id,
      description: `Received items for ${po.orderNumber}. Current status: ${po.status}`,
    });

    this.addNotification({
      title: "Stock Received",
      message: `Purchase Order ${po.orderNumber} received into ${po.warehouseName}.`,
      type: "PURCHASE_ORDER",
      link: "/purchase-orders",
    });

    this.notify();
    return { success: true };
  }

  // --- Sales Orders ---
  public getSalesOrders(): SalesOrderDTO[] {
    return [...this.salesOrders];
  }

  public createSalesOrder(data: {
    customerId: string;
    warehouseId: string;
    deliveryDate?: string | null;
    discount?: number;
    tax?: number;
    notes?: string | null;
    items: { productId: string; quantity: number; unitPrice: number }[];
  }): SalesOrderDTO {
    const customer = this.customers.find((c) => c.id === data.customerId);
    const warehouse = this.warehouses.find((w) => w.id === data.warehouseId);

    const items = data.items.map((item) => {
      const prod = this.products.find((p) => p.id === item.productId);
      return {
        id: `soi-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        salesOrderId: "",
        productId: item.productId,
        productName: prod ? prod.name : "Product",
        productSku: prod ? prod.sku : "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalAmount: item.quantity * item.unitPrice,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.totalAmount, 0);
    const discount = data.discount || 0;
    const tax = data.tax || (subtotal - discount) * 0.07;
    const totalAmount = subtotal - discount + tax;

    const id = `so-${Date.now()}`;
    const soNumber = generateOrderNumber("SO");
    items.forEach((i) => (i.salesOrderId = id));

    const newSO: SalesOrderDTO = {
      id,
      orderNumber: soNumber,
      customerId: data.customerId,
      customerName: customer ? customer.name : "Customer",
      warehouseId: data.warehouseId,
      warehouseName: warehouse ? warehouse.name : "Warehouse",
      orderDate: new Date().toISOString(),
      deliveryDate: data.deliveryDate || null,
      status: "DRAFT",
      subtotal,
      discount,
      tax,
      totalAmount,
      notes: data.notes || null,
      createdById: this.currentUser.id,
      createdByName: this.currentUser.name,
      items,
      createdAt: new Date().toISOString(),
    };

    this.salesOrders.unshift(newSO);
    this.logAudit({
      action: "CREATE_SALES_ORDER",
      resourceType: "SALES_ORDER",
      resourceId: id,
      description: `Created Sales Order ${soNumber} for ${customer?.name} ($${totalAmount.toFixed(2)})`,
    });

    this.notify();
    return newSO;
  }

  public confirmSalesOrder(soId: string): { success: boolean; error?: string } {
    const so = this.salesOrders.find((s) => s.id === soId);
    if (!so) return { success: false, error: "Sales Order not found" };

    if (so.status !== "DRAFT") {
      return { success: false, error: `Sales Order is already in ${so.status} status` };
    }

    // Check stock availability in warehouse
    for (const item of so.items) {
      const prod = this.products.find((p) => p.id === item.productId);
      if (!prod) return { success: false, error: `Product not found: ${item.productName}` };

      const inv = prod.inventories?.find((i) => i.warehouseId === so.warehouseId);
      const available = inv ? inv.quantity - inv.reservedQuantity : 0;

      if (available < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${item.productName} in ${so.warehouseName}. Available: ${available}, Required: ${item.quantity}`,
        };
      }
    }

    // Deduct stock and record SALE transactions
    for (const item of so.items) {
      this.adjustStock({
        productId: item.productId,
        warehouseId: so.warehouseId,
        quantityChange: -item.quantity,
        type: "SALE",
        referenceId: so.id,
        referenceType: "SALES_ORDER",
        notes: `Fulfillment for Sales Order ${so.orderNumber}`,
      });
    }

    so.status = "CONFIRMED";
    this.logAudit({
      action: "CONFIRM_SALES_ORDER",
      resourceType: "SALES_ORDER",
      resourceId: so.id,
      description: `Confirmed Sales Order ${so.orderNumber} and deducted stock.`,
    });

    this.addNotification({
      title: "Sales Order Confirmed",
      message: `Sales Order ${so.orderNumber} confirmed and stock deducted.`,
      type: "SALES_ORDER",
      link: "/sales-orders",
    });

    this.notify();
    return { success: true };
  }

  public completeSalesOrder(soId: string): boolean {
    const so = this.salesOrders.find((s) => s.id === soId);
    if (!so) return false;
    so.status = "COMPLETED";
    this.logAudit({
      action: "COMPLETE_SALES_ORDER",
      resourceType: "SALES_ORDER",
      resourceId: so.id,
      description: `Marked Sales Order ${so.orderNumber} as COMPLETED.`,
    });
    this.notify();
    return true;
  }

  public cancelSalesOrder(soId: string): { success: boolean; error?: string } {
    const so = this.salesOrders.find((s) => s.id === soId);
    if (!so) return { success: false, error: "Sales Order not found" };

    if (so.status === "CANCELLED") return { success: false, error: "Order already cancelled" };

    // If order was confirmed or completed, restore stock
    if (so.status === "CONFIRMED" || so.status === "PROCESSING" || so.status === "COMPLETED") {
      for (const item of so.items) {
        this.adjustStock({
          productId: item.productId,
          warehouseId: so.warehouseId,
          quantityChange: item.quantity,
          type: "RETURN",
          referenceId: so.id,
          referenceType: "SALES_ORDER",
          notes: `Restored inventory from cancelled Sales Order ${so.orderNumber}`,
        });
      }
    }

    so.status = "CANCELLED";
    this.logAudit({
      action: "CANCEL_SALES_ORDER",
      resourceType: "SALES_ORDER",
      resourceId: so.id,
      description: `Cancelled Sales Order ${so.orderNumber} and restored stock.`,
    });

    this.notify();
    return { success: true };
  }

  // --- Stock Transfers ---
  public getStockTransfers(): StockTransferDTO[] {
    return [...this.stockTransfers];
  }

  public createStockTransfer(data: {
    sourceWarehouseId: string;
    destinationWarehouseId: string;
    notes?: string | null;
    items: { productId: string; requestedQuantity: number }[];
  }): StockTransferDTO {
    const src = this.warehouses.find((w) => w.id === data.sourceWarehouseId);
    const dest = this.warehouses.find((w) => w.id === data.destinationWarehouseId);

    const items = data.items.map((item) => {
      const prod = this.products.find((p) => p.id === item.productId);
      return {
        id: `ti-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        stockTransferId: "",
        productId: item.productId,
        productName: prod ? prod.name : "Product",
        productSku: prod ? prod.sku : "",
        requestedQuantity: item.requestedQuantity,
        sentQuantity: 0,
        receivedQuantity: 0,
      };
    });

    const id = `trf-${Date.now()}`;
    const trfNumber = generateOrderNumber("TRF");
    items.forEach((i) => (i.stockTransferId = id));

    const newTransfer: StockTransferDTO = {
      id,
      transferNumber: trfNumber,
      sourceWarehouseId: data.sourceWarehouseId,
      sourceWarehouseName: src ? src.name : "Source",
      destinationWarehouseId: data.destinationWarehouseId,
      destinationWarehouseName: dest ? dest.name : "Destination",
      status: "DRAFT",
      requestedById: this.currentUser.id,
      requestedByName: this.currentUser.name,
      sentById: null,
      sentByName: null,
      receivedById: null,
      receivedByName: null,
      sentDate: null,
      receivedDate: null,
      notes: data.notes || null,
      items,
      createdAt: new Date().toISOString(),
    };

    this.stockTransfers.unshift(newTransfer);
    this.logAudit({
      action: "CREATE_STOCK_TRANSFER",
      resourceType: "STOCK_TRANSFER",
      resourceId: id,
      description: `Created Stock Transfer ${trfNumber} from ${src?.name} to ${dest?.name}`,
    });

    this.notify();
    return newTransfer;
  }

  public approveStockTransfer(trfId: string): boolean {
    const trf = this.stockTransfers.find((t) => t.id === trfId);
    if (!trf) return false;
    trf.status = "APPROVED";
    this.notify();
    return true;
  }

  public dispatchStockTransfer(trfId: string): { success: boolean; error?: string } {
    const trf = this.stockTransfers.find((t) => t.id === trfId);
    if (!trf) return { success: false, error: "Transfer not found" };

    if (trf.status !== "APPROVED" && trf.status !== "DRAFT" && trf.status !== "PENDING_APPROVAL") {
      return { success: false, error: `Cannot dispatch transfer in status ${trf.status}` };
    }

    // Validate stock in source warehouse
    for (const item of trf.items) {
      const prod = this.products.find((p) => p.id === item.productId);
      const inv = prod?.inventories?.find((i) => i.warehouseId === trf.sourceWarehouseId);
      const available = inv ? inv.quantity : 0;
      if (available < item.requestedQuantity) {
        return {
          success: false,
          error: `Source warehouse (${trf.sourceWarehouseName}) has only ${available} units of ${item.productName}, but ${item.requestedQuantity} requested.`,
        };
      }
    }

    // Deduct stock from source warehouse and mark IN_TRANSIT
    for (const item of trf.items) {
      item.sentQuantity = item.requestedQuantity;
      this.adjustStock({
        productId: item.productId,
        warehouseId: trf.sourceWarehouseId,
        quantityChange: -item.requestedQuantity,
        type: "TRANSFER_OUT",
        referenceId: trf.id,
        referenceType: "STOCK_TRANSFER",
        notes: `Dispatched in transfer ${trf.transferNumber} to ${trf.destinationWarehouseName}`,
      });
    }

    trf.status = "IN_TRANSIT";
    trf.sentById = this.currentUser.id;
    trf.sentByName = this.currentUser.name;
    trf.sentDate = new Date().toISOString();

    this.logAudit({
      action: "DISPATCH_STOCK_TRANSFER",
      resourceType: "STOCK_TRANSFER",
      resourceId: trf.id,
      description: `Dispatched transfer ${trf.transferNumber} from ${trf.sourceWarehouseName}`,
    });

    this.addNotification({
      title: "Transfer Dispatched",
      message: `Transfer ${trf.transferNumber} is now IN TRANSIT to ${trf.destinationWarehouseName}.`,
      type: "STOCK_TRANSFER",
      link: "/stock-transfers",
    });

    this.notify();
    return { success: true };
  }

  public receiveStockTransfer(trfId: string): { success: boolean; error?: string } {
    const trf = this.stockTransfers.find((t) => t.id === trfId);
    if (!trf) return { success: false, error: "Transfer not found" };

    if (trf.status !== "IN_TRANSIT") {
      return { success: false, error: `Transfer must be IN_TRANSIT to receive. Current: ${trf.status}` };
    }

    // Add stock to destination warehouse
    for (const item of trf.items) {
      item.receivedQuantity = item.sentQuantity;
      this.adjustStock({
        productId: item.productId,
        warehouseId: trf.destinationWarehouseId,
        quantityChange: item.receivedQuantity,
        type: "TRANSFER_IN",
        referenceId: trf.id,
        referenceType: "STOCK_TRANSFER",
        notes: `Received from transfer ${trf.transferNumber} from ${trf.sourceWarehouseName}`,
      });
    }

    trf.status = "RECEIVED";
    trf.receivedById = this.currentUser.id;
    trf.receivedByName = this.currentUser.name;
    trf.receivedDate = new Date().toISOString();

    this.logAudit({
      action: "RECEIVE_STOCK_TRANSFER",
      resourceType: "STOCK_TRANSFER",
      resourceId: trf.id,
      description: `Received stock transfer ${trf.transferNumber} in ${trf.destinationWarehouseName}`,
    });

    this.addNotification({
      title: "Transfer Received",
      message: `Stock transfer ${trf.transferNumber} safely received in ${trf.destinationWarehouseName}.`,
      type: "STOCK_TRANSFER",
      link: "/stock-transfers",
    });

    this.notify();
    return { success: true };
  }

  // --- Low Stock Checks & Alerts ---
  private checkLowStockAlert(product: ProductDTO) {
    product.inventories?.forEach((inv) => {
      const warehouse = this.warehouses.find((w) => w.id === inv.warehouseId);
      if (!warehouse) return;

      const shortage = product.minStockLevel - inv.quantity;
      const existingAlert = this.alerts.find(
        (a) => a.productId === product.id && a.warehouseId === inv.warehouseId && a.status !== "RESOLVED"
      );

      if (inv.quantity <= product.minStockLevel) {
        if (!existingAlert) {
          const newAlert: LowStockAlertDTO = {
            id: `alt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            barcode: product.barcode,
            warehouseId: inv.warehouseId,
            warehouseName: warehouse.name,
            currentQuantity: inv.quantity,
            minStockLevel: product.minStockLevel,
            shortageQuantity: Math.max(0, shortage),
            status: "NEW",
            createdAt: new Date().toISOString(),
          };
          this.alerts.unshift(newAlert);

          this.addNotification({
            title: inv.quantity === 0 ? "Out of Stock Alert" : "Low Stock Alert",
            message: `${product.name} is ${inv.quantity === 0 ? "OUT OF STOCK" : `below threshold (${inv.quantity}/${product.minStockLevel})`} in ${warehouse.name}`,
            type: inv.quantity === 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
            link: "/low-stock",
          });
        } else {
          existingAlert.currentQuantity = inv.quantity;
          existingAlert.shortageQuantity = Math.max(0, shortage);
        }
      } else if (existingAlert) {
        existingAlert.status = "RESOLVED";
        existingAlert.resolvedAt = new Date().toISOString();
      }
    });
  }

  public getAlerts(): LowStockAlertDTO[] {
    return [...this.alerts];
  }

  public resolveAlert(alertId: string) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = "RESOLVED";
      alert.resolvedAt = new Date().toISOString();
      this.notify();
    }
  }

  // --- Notifications ---
  public getNotifications(): NotificationDTO[] {
    return [...this.notifications];
  }

  public markNotificationAsRead(id: string) {
    const n = this.notifications.find((notif) => notif.id === id);
    if (n) {
      n.read = true;
      this.notify();
    }
  }

  public markAllNotificationsAsRead() {
    this.notifications.forEach((n) => (n.read = true));
    this.notify();
  }

  public addNotification(data: Omit<NotificationDTO, "id" | "read" | "createdAt">) {
    const notif: NotificationDTO = {
      ...data,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(notif);
    this.notify();
  }

  // --- Forecasting ---
  public getForecasts(): ForecastDTO[] {
    return [...this.forecasts];
  }

  public calculateForecast(productId: string): ForecastDTO | undefined {
    const prod = this.products.find((p) => p.id === productId);
    if (!prod) return undefined;

    // Calculate historical sales from transactions
    const salesTxns = this.transactions.filter(
      (t) => t.productId === productId && t.type === "SALE"
    );

    const totalSold = salesTxns.reduce((sum, t) => sum + Math.abs(t.quantityChange), 0);
    const avgDaily = totalSold > 0 ? Number((totalSold / 7).toFixed(1)) : 3.2;
    const pred7 = Math.round(avgDaily * 7);
    const pred30 = Math.round(avgDaily * 30);
    const daysRemaining = avgDaily > 0 ? Math.round(prod.totalStock / avgDaily) : 999;
    const reorderQty = Math.max(0, pred30 - prod.totalStock + prod.minStockLevel);

    const forecast: ForecastDTO = {
      id: `fc-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      productSku: prod.sku,
      calculatedAt: new Date().toISOString(),
      dailyAvgSales: avgDaily,
      predictedDemand7d: pred7,
      predictedDemand30d: pred30,
      currentStock: prod.totalStock,
      estimatedDaysRemaining: daysRemaining,
      recommendedReorderQty: reorderQty,
      historicalSalesTrend: [
        { date: "Day -6", quantity: Math.round(avgDaily * 0.9) },
        { date: "Day -5", quantity: Math.round(avgDaily * 1.1) },
        { date: "Day -4", quantity: Math.round(avgDaily * 0.8) },
        { date: "Day -3", quantity: Math.round(avgDaily * 1.2) },
        { date: "Day -2", quantity: Math.round(avgDaily * 1.0) },
        { date: "Yesterday", quantity: Math.round(avgDaily * 1.3) },
        { date: "Today", quantity: Math.round(avgDaily) },
      ],
      projectedSalesTrend: [
        { date: "+1 Day", quantity: Math.round(avgDaily) },
        { date: "+2 Days", quantity: Math.round(avgDaily * 1.05) },
        { date: "+3 Days", quantity: Math.round(avgDaily * 0.95) },
        { date: "+4 Days", quantity: Math.round(avgDaily * 1.1) },
        { date: "+5 Days", quantity: Math.round(avgDaily * 1.0) },
        { date: "+6 Days", quantity: Math.round(avgDaily * 1.0) },
        { date: "+7 Days", quantity: Math.round(avgDaily * 1.15) },
      ],
      notes: daysRemaining < 14 ? "CRITICAL: Stock will run out in less than 2 weeks." : "Stock velocity normal.",
    };

    const idx = this.forecasts.findIndex((f) => f.productId === productId);
    if (idx >= 0) this.forecasts[idx] = forecast;
    else this.forecasts.unshift(forecast);

    this.notify();
    return forecast;
  }

  // --- Warehouses, Suppliers, Customers, Categories ---
  public getWarehouses(): WarehouseDTO[] {
    return [...this.warehouses];
  }

  public createWarehouse(data: Omit<WarehouseDTO, "id" | "totalProductsCount" | "totalInventoryValue" | "lowStockItemsCount" | "createdAt">): WarehouseDTO {
    const newW: WarehouseDTO = {
      ...data,
      id: `wh-${Date.now()}`,
      totalProductsCount: 0,
      totalInventoryValue: 0,
      lowStockItemsCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.warehouses.push(newW);
    this.logAudit({
      action: "CREATE_WAREHOUSE",
      resourceType: "WAREHOUSE",
      resourceId: newW.id,
      description: `Created warehouse ${newW.name} (${newW.code})`,
    });
    this.notify();
    return newW;
  }

  public getSuppliers(): SupplierDTO[] {
    return [...this.suppliers];
  }

  public createSupplier(data: Omit<SupplierDTO, "id" | "totalPurchased" | "purchaseOrdersCount" | "createdAt">): SupplierDTO {
    const sup: SupplierDTO = {
      ...data,
      id: `sup-${Date.now()}`,
      totalPurchased: 0,
      purchaseOrdersCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.suppliers.push(sup);
    this.logAudit({
      action: "CREATE_SUPPLIER",
      resourceType: "SUPPLIER",
      resourceId: sup.id,
      description: `Created supplier ${sup.name}`,
    });
    this.notify();
    return sup;
  }

  public getCustomers(): CustomerDTO[] {
    return [...this.customers];
  }

  public createCustomer(data: Omit<CustomerDTO, "id" | "totalSpent" | "salesOrdersCount" | "createdAt">): CustomerDTO {
    const cust: CustomerDTO = {
      ...data,
      id: `cust-${Date.now()}`,
      totalSpent: 0,
      salesOrdersCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.customers.push(cust);
    this.logAudit({
      action: "CREATE_CUSTOMER",
      resourceType: "CUSTOMER",
      resourceId: cust.id,
      description: `Created customer ${cust.name}`,
    });
    this.notify();
    return cust;
  }

  public getCategories(): CategoryDTO[] {
    return [...this.categories];
  }

  public getTransactions(): InventoryTransactionDTO[] {
    return [...this.transactions];
  }

  public getUsers(): UserDTO[] {
    return [...this.users];
  }

  public createUser(data: Omit<UserDTO, "id" | "createdAt">): UserDTO {
    const user: UserDTO = {
      ...data,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    this.logAudit({ action: "CREATE_USER", resourceType: "USER", resourceId: user.id, description: `Created user ${user.name}` });
    this.notify();
    return user;
  }

  public deleteUser(id: string): boolean {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    const name = this.users[idx].name;
    this.users.splice(idx, 1);
    this.logAudit({ action: "DELETE_USER", resourceType: "USER", resourceId: id, description: `Deleted user ${name}` });
    this.notify();
    return true;
  }

  public deleteProduct(id: string): boolean {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const name = this.products[idx].name;
    this.products.splice(idx, 1);
    this.logAudit({ action: "DELETE_PRODUCT", resourceType: "PRODUCT", resourceId: id, description: `Deleted product ${name}` });
    this.notify();
    return true;
  }

  public deleteCustomer(id: string): boolean {
    const idx = this.customers.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    const name = this.customers[idx].name;
    this.customers.splice(idx, 1);
    this.logAudit({ action: "DELETE_CUSTOMER", resourceType: "CUSTOMER", resourceId: id, description: `Deleted customer ${name}` });
    this.notify();
    return true;
  }

  public getAuditLogs(): AuditLogDTO[] {
    return [...this.auditLogs];
  }

  private logAudit(data: Omit<AuditLogDTO, "id" | "userId" | "userName" | "createdAt">) {
    const log: AuditLogDTO = {
      ...data,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
  }

  // --- Executive Dashboard KPIs ---
  public getDashboardKPIs() {
    const totalInventoryValue = this.products.reduce((acc, p) => acc + p.totalStock * p.costPrice, 0);
    const totalProducts = this.products.length;
    const totalWarehouses = this.warehouses.length;
    const lowStockProducts = this.products.filter((p) => p.totalStock > 0 && p.totalStock <= p.minStockLevel).length;
    const outOfStockProducts = this.products.filter((p) => p.totalStock === 0).length;
    const pendingPurchaseOrders = this.purchaseOrders.filter((po) => po.status === "DRAFT" || po.status === "SUBMITTED" || po.status === "APPROVED" || po.status === "PARTIALLY_RECEIVED").length;
    const pendingSalesOrders = this.salesOrders.filter((so) => so.status === "DRAFT" || so.status === "CONFIRMED" || so.status === "PROCESSING").length;
    const pendingStockTransfers = this.stockTransfers.filter((t) => t.status === "DRAFT" || t.status === "PENDING_APPROVAL" || t.status === "APPROVED" || t.status === "IN_TRANSIT").length;

    return {
      totalInventoryValue,
      totalProducts,
      totalWarehouses,
      lowStockProducts,
      outOfStockProducts,
      pendingPurchaseOrders,
      pendingSalesOrders,
      pendingStockTransfers,
    };
  }

  // --- Global Search ---
  public globalSearch(query: string) {
    const q = query.toLowerCase().trim();
    if (!q) return { products: [], orders: [], warehouses: [], suppliers: [], customers: [] };

    const products = this.products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q))
    ).slice(0, 5);

    const purchaseOrders = this.purchaseOrders.filter(
      (po) => po.orderNumber.toLowerCase().includes(q) || po.supplierName.toLowerCase().includes(q)
    ).slice(0, 4);

    const salesOrders = this.salesOrders.filter(
      (so) => so.orderNumber.toLowerCase().includes(q) || so.customerName.toLowerCase().includes(q)
    ).slice(0, 4);

    const warehouses = this.warehouses.filter(
      (w) => w.name.toLowerCase().includes(q) || w.code.toLowerCase().includes(q) || (w.city && w.city.toLowerCase().includes(q))
    ).slice(0, 3);

    const suppliers = this.suppliers.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.email && s.email.toLowerCase().includes(q))
    ).slice(0, 3);

    const customers = this.customers.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.email && c.email.toLowerCase().includes(q))
    ).slice(0, 3);

    return {
      products,
      orders: [...purchaseOrders, ...salesOrders],
      warehouses,
      suppliers,
      customers,
    };
  }
}

export const dataStore = new InventoryDataStore();
export default dataStore;
