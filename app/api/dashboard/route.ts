import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const [
      totalProducts,
      totalWarehouses,
      inventories,
      pendingPurchaseOrders,
      pendingSalesOrders,
      pendingStockTransfers,
    ] = await Promise.all([
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.warehouse.count({ where: { status: "ACTIVE" } }),
      prisma.productInventory.findMany({
        include: { product: true },
      }),
      prisma.purchaseOrder.count({
        where: { status: { in: ["DRAFT", "SUBMITTED", "APPROVED", "PARTIALLY_RECEIVED"] } },
      }),
      prisma.salesOrder.count({
        where: { status: { in: ["DRAFT", "CONFIRMED", "PROCESSING"] } },
      }),
      prisma.stockTransfer.count({
        where: { status: { in: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "IN_TRANSIT"] } },
      }),
    ]);

    // Calculate inventory KPIs
    let totalInventoryValue = 0;
    let lowStockProducts = 0;
    let outOfStockProducts = 0;

    // Group by product
    const productStockMap: Record<string, { totalStock: number; minStockLevel: number; costPrice: number }> = {};

    for (const inv of inventories) {
      const pid = inv.productId;
      if (!productStockMap[pid]) {
        productStockMap[pid] = {
          totalStock: 0,
          minStockLevel: (inv.product as any).minStockLevel,
          costPrice: Number((inv.product as any).costPrice),
        };
      }
      productStockMap[pid].totalStock += inv.quantity;
    }

    for (const pid in productStockMap) {
      const { totalStock, minStockLevel, costPrice } = productStockMap[pid];
      totalInventoryValue += totalStock * costPrice;
      if (totalStock === 0) outOfStockProducts++;
      else if (totalStock < minStockLevel) lowStockProducts++;
    }

    return NextResponse.json({
      totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
      totalProducts,
      totalWarehouses,
      lowStockProducts,
      outOfStockProducts,
      pendingPurchaseOrders,
      pendingSalesOrders,
      pendingStockTransfers,
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
