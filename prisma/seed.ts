import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import * as bcrypt from "bcryptjs";
import path from "path";
import {
  INITIAL_USERS,
  INITIAL_WAREHOUSES,
  INITIAL_CATEGORIES,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
} from "../lib/mock-data";

// Resolve absolute path to the DB file (seed.ts is in prisma/ dir)
const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
const dbUrl = `file:${dbPath}`;

const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log(`Seeding database at: ${dbUrl}`);

  // Clean existing data in reverse dependency order
  await prisma.forecast.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.lowStockAlert.deleteMany();
  await prisma.stockTransferItem.deleteMany();
  await prisma.stockTransfer.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.productInventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.warehouse.deleteMany();

  console.log("Cleaned existing data.");

  // Seed warehouses first (users reference them)
  for (const wh of INITIAL_WAREHOUSES) {
    await prisma.warehouse.create({
      data: {
        id: wh.id,
        name: wh.name,
        code: wh.code,
        address: wh.address ?? null,
        city: wh.city ?? null,
        country: wh.country ?? null,
        phone: wh.phone ?? null,
        email: wh.email ?? null,
        managerName: wh.managerName ?? null,
        status: wh.status as any,
        createdAt: new Date(wh.createdAt),
      },
    });
  }
  console.log(`Seeded ${INITIAL_WAREHOUSES.length} warehouses.`);

  // Seed categories
  for (const cat of INITIAL_CATEGORIES) {
    await prisma.category.create({
      data: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description ?? null,
      },
    });
  }
  console.log(`Seeded ${INITIAL_CATEGORIES.length} categories.`);

  // Seed suppliers
  for (const sup of INITIAL_SUPPLIERS) {
    await prisma.supplier.create({
      data: {
        id: sup.id,
        name: sup.name,
        contactPerson: sup.contactPerson ?? null,
        email: sup.email ?? null,
        phone: sup.phone ?? null,
        address: sup.address ?? null,
        city: sup.city ?? null,
        country: sup.country ?? null,
        status: sup.status as any,
        notes: sup.notes ?? null,
        createdAt: new Date(sup.createdAt),
      },
    });
  }
  console.log(`Seeded ${INITIAL_SUPPLIERS.length} suppliers.`);

  // Seed customers
  for (const cust of INITIAL_CUSTOMERS) {
    await prisma.customer.create({
      data: {
        id: cust.id,
        name: cust.name,
        contactPerson: cust.contactPerson ?? null,
        email: cust.email ?? null,
        phone: cust.phone ?? null,
        address: cust.address ?? null,
        city: cust.city ?? null,
        country: cust.country ?? null,
        status: cust.status as any,
        notes: cust.notes ?? null,
        createdAt: new Date(cust.createdAt),
      },
    });
  }
  console.log(`Seeded ${INITIAL_CUSTOMERS.length} customers.`);

  // Seed users with hashed passwords (password "password123" for all)
  const passwordHash = await bcrypt.hash("password123", 10);
  for (const user of INITIAL_USERS) {
    await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role as any,
        phone: user.phone ?? null,
        status: user.status as any,
        warehouseId: user.warehouseId ?? null,
        createdAt: new Date(user.createdAt),
      },
    });
  }
  console.log(`Seeded ${INITIAL_USERS.length} users.`);

  // Seed products with inventory
  for (const prod of INITIAL_PRODUCTS) {
    await prisma.product.create({
      data: {
        id: prod.id,
        name: prod.name,
        sku: prod.sku,
        barcode: prod.barcode ?? null,
        qrCode: prod.qrCode ?? null,
        description: prod.description ?? null,
        uom: prod.uom,
        costPrice: prod.costPrice,
        sellingPrice: prod.sellingPrice,
        discountPercent: prod.discountPercent ?? null,
        minStockLevel: prod.minStockLevel,
        maxStockLevel: prod.maxStockLevel ?? null,
        imageUrl: prod.imageUrl ?? null,
        status: prod.status as any,
        categoryId: prod.categoryId ?? null,
        supplierId: prod.supplierId ?? null,
        createdAt: new Date(prod.createdAt),
      },
    });

    // Seed product inventories
    if (prod.inventories) {
      for (const inv of prod.inventories) {
        await prisma.productInventory.create({
          data: {
            id: inv.id,
            productId: inv.productId,
            warehouseId: inv.warehouseId,
            quantity: inv.quantity,
            reservedQuantity: inv.reservedQuantity,
            locationBin: inv.locationBin ?? null,
          },
        });
      }
    }
  }
  console.log(`Seeded ${INITIAL_PRODUCTS.length} products with inventory.`);

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
