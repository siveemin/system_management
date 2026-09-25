import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [
      totalProducts,
      totalWarehouses,
      totalCustomers,
      inventories,
      pendingPurchaseOrders,
      pendingSalesOrders,
      pendingStockTransfers,
      allSalesOrders,
      allPurchaseOrders,
      recentTransactions,
      categories,
      recentProducts,
      recentSalesOrders,
      recentPurchaseOrders,
      customersThisMonth,
      customersLastMonth,
    ] = await Promise.all([
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.warehouse.count({ where: { status: "ACTIVE" } }),
      prisma.customer.count({ where: { status: "ACTIVE" } }),
      prisma.productInventory.findMany({ include: { product: true } }),
      prisma.purchaseOrder.count({
        where: { status: { in: ["DRAFT", "SUBMITTED", "APPROVED", "PARTIALLY_RECEIVED"] } },
      }),
      prisma.salesOrder.count({
        where: { status: { in: ["DRAFT", "CONFIRMED", "PROCESSING"] } },
      }),
      prisma.stockTransfer.count({
        where: { status: { in: ["DRAFT", "PENDING_APPROVAL", "APPROVED", "IN_TRANSIT"] } },
      }),
      prisma.salesOrder.findMany({
        where: { createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true, totalAmount: true },
      }),
      prisma.purchaseOrder.findMany({
        where: { createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true, totalAmount: true },
      }),
      prisma.inventoryTransaction.findMany({
        include: { product: true, warehouse: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.category.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { products: { _count: "desc" } },
        take: 5,
      }),
      prisma.product.findMany({
        include: { category: true, inventories: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.salesOrder.findMany({
        include: { customer: true, warehouse: true },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.purchaseOrder.findMany({
        include: { supplier: true, warehouse: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.customer.count({ where: { createdAt: { gte: thisMonthStart } } }),
      prisma.customer.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
    ]);

    // Inventory KPIs
    let totalInventoryValue = 0;
    let lowStockProducts = 0;
    let outOfStockProducts = 0;
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

    // Revenue comparisons
    const revenueThisMonth = (allSalesOrders as any[])
      .filter((o: any) => new Date(o.createdAt) >= thisMonthStart)
      .reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
    const revenueLastMonth = (allSalesOrders as any[])
      .filter((o: any) => new Date(o.createdAt) >= lastMonthStart && new Date(o.createdAt) < thisMonthStart)
      .reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
    const ordersThisMonth = (allSalesOrders as any[]).filter((o: any) => new Date(o.createdAt) >= thisMonthStart).length;
    const ordersLastMonth = (allSalesOrders as any[]).filter(
      (o: any) => new Date(o.createdAt) >= lastMonthStart && new Date(o.createdAt) < thisMonthStart
    ).length;

    // Monthly chart data (last 12 months)
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const month = start.toLocaleString("en", { month: "short" });
      const sales = (allSalesOrders as any[]).filter(
        (o: any) => new Date(o.createdAt) >= start && new Date(o.createdAt) < end
      ).length;
      const purchases = (allPurchaseOrders as any[]).filter(
        (o: any) => new Date(o.createdAt) >= start && new Date(o.createdAt) < end
      ).length;
      const revenue = (allSalesOrders as any[])
        .filter((o: any) => new Date(o.createdAt) >= start && new Date(o.createdAt) < end)
        .reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
      monthlyData.push({ month, sales, purchases, revenue });
    }

    // Category breakdown
    const totalCatProducts = (categories as any[]).reduce((s: number, c: any) => s + c._count.products, 0);
    const categoryData = (categories as any[]).map((c: any) => ({
      name: c.name,
      count: c._count.products,
      pct: totalCatProducts > 0 ? Math.round((c._count.products / totalCatProducts) * 100) : 0,
    }));

    // Recent transactions
    const transactions = (recentTransactions as any[]).map((t: any) => ({
      id: t.id,
      transactionNumber: t.transactionNumber,
      productId: t.productId,
      productName: t.product.name,
      warehouseId: t.warehouseId,
      warehouseName: t.warehouse.name,
      type: t.type,
      quantityBefore: t.quantityBefore,
      quantityChange: t.quantityChange,
      quantityAfter: t.quantityAfter,
      referenceType: t.referenceType,
      notes: t.notes,
      createdAt: t.createdAt.toISOString(),
    }));

    // Recent products
    const products = (recentProducts as any[]).map((p: any) => {
      const totalStock = p.inventories.reduce((s: number, inv: any) => s + inv.quantity, 0);
      const totalReserved = p.inventories.reduce((s: number, inv: any) => s + inv.reservedQuantity, 0);
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        costPrice: Number(p.costPrice),
        sellingPrice: Number(p.sellingPrice),
        minStockLevel: p.minStockLevel,
        imageUrl: p.imageUrl,
        status: p.status,
        categoryName: p.category?.name ?? null,
        totalStock,
        totalReserved,
        totalAvailable: totalStock - totalReserved,
      };
    });

    // Recent orders (sales + purchase combined)
    const recentOrders = [
      ...(recentSalesOrders as any[]).map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        type: "SALES",
        partyName: o.customer.name,
        warehouseName: o.warehouse.name,
        totalAmount: Number(o.totalAmount),
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
      ...(recentPurchaseOrders as any[]).map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        type: "PURCHASE",
        partyName: o.supplier.name,
        warehouseName: o.warehouse.name,
        totalAmount: Number(o.totalAmount),
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);

    return NextResponse.json({
      kpis: {
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
        totalProducts,
        totalWarehouses,
        totalCustomers,
        lowStockProducts,
        outOfStockProducts,
        pendingPurchaseOrders,
        pendingSalesOrders,
        pendingStockTransfers,
        revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
        revenueLastMonth: Math.round(revenueLastMonth * 100) / 100,
        ordersThisMonth,
        ordersLastMonth,
        customersThisMonth,
        customersLastMonth,
      },
      monthlyData,
      categoryData,
      transactions,
      products,
      recentOrders,
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
