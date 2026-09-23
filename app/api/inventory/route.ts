import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const inventories = await prisma.productInventory.findMany({
      include: {
        product: {
          include: { category: true, supplier: true },
        },
        warehouse: true,
      },
      orderBy: { product: { name: "asc" } },
    });

    return NextResponse.json(inventories.map((inv: any) => ({
      id: inv.id,
      productId: inv.productId,
      productName: inv.product.name,
      productSku: inv.product.sku,
      categoryName: inv.product.category?.name ?? null,
      supplierName: inv.product.supplier?.name ?? null,
      warehouseId: inv.warehouseId,
      warehouseName: inv.warehouse.name,
      warehouseCode: inv.warehouse.code,
      quantity: inv.quantity,
      reservedQuantity: inv.reservedQuantity,
      availableQuantity: inv.quantity - inv.reservedQuantity,
      locationBin: inv.locationBin,
      minStockLevel: inv.product.minStockLevel,
      updatedAt: inv.updatedAt.toISOString(),
    })));
  } catch (error) {
    console.error("GET /api/inventory error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
