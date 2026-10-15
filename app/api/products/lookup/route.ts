import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  if (!prisma) return NextResponse.json(null, { status: 503 });

  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json(null, { status: 400 });

  try {
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { barcode: q },
          { sku: q },
          { qrCode: q },
        ],
      },
      include: {
        category: true,
        supplier: true,
        inventories: { include: { warehouse: true } },
      },
    });

    if (!product) return NextResponse.json(null, { status: 404 });

    const totalStock = product.inventories.reduce((s: number, i: any) => s + i.quantity, 0);
    const totalReserved = product.inventories.reduce((s: number, i: any) => s + i.reservedQuantity, 0);

    return NextResponse.json({
      id: product.id, name: product.name, sku: product.sku,
      barcode: product.barcode, qrCode: product.qrCode,
      description: product.description, uom: product.uom,
      costPrice: Number(product.costPrice), sellingPrice: Number(product.sellingPrice),
      discountPercent: product.discountPercent,
      minStockLevel: product.minStockLevel, maxStockLevel: product.maxStockLevel,
      imageUrl: product.imageUrl, status: product.status,
      categoryId: product.categoryId, categoryName: (product as any).category?.name ?? null,
      supplierId: product.supplierId, supplierName: (product as any).supplier?.name ?? null,
      totalStock, totalReserved, totalAvailable: totalStock - totalReserved,
      inventories: product.inventories.map((inv: any) => ({
        id: inv.id, productId: inv.productId, warehouseId: inv.warehouseId,
        warehouseName: inv.warehouse.name, warehouseCode: inv.warehouse.code,
        quantity: inv.quantity, reservedQuantity: inv.reservedQuantity,
        availableQuantity: inv.quantity - inv.reservedQuantity,
        locationBin: inv.locationBin, updatedAt: inv.updatedAt.toISOString(),
      })),
      createdAt: product.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("GET /api/products/lookup error:", error);
    return NextResponse.json(null, { status: 500 });
  }
}
