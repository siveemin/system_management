import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const products = await prisma.product.findMany({
      include: {
        category: true,
        supplier: true,
        inventories: {
          include: { warehouse: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = products.map((p: any) => {
      const totalStock = p.inventories.reduce((sum: number, inv: any) => sum + inv.quantity, 0);
      const totalReserved = p.inventories.reduce((sum: number, inv: any) => sum + inv.reservedQuantity, 0);
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        qrCode: p.qrCode,
        description: p.description,
        uom: p.uom,
        costPrice: Number(p.costPrice),
        sellingPrice: Number(p.sellingPrice),
        discountPercent: p.discountPercent,
        minStockLevel: p.minStockLevel,
        maxStockLevel: p.maxStockLevel,
        imageUrl: p.imageUrl,
        status: p.status,
        categoryId: p.categoryId,
        categoryName: p.category?.name ?? null,
        supplierId: p.supplierId,
        supplierName: p.supplier?.name ?? null,
        totalStock,
        totalReserved,
        totalAvailable: totalStock - totalReserved,
        inventories: p.inventories.map((inv: any) => ({
          id: inv.id,
          productId: inv.productId,
          warehouseId: inv.warehouseId,
          warehouseName: inv.warehouse.name,
          warehouseCode: inv.warehouse.code,
          quantity: inv.quantity,
          reservedQuantity: inv.reservedQuantity,
          availableQuantity: inv.quantity - inv.reservedQuantity,
          locationBin: inv.locationBin,
          updatedAt: inv.updatedAt.toISOString(),
        })),
        createdAt: p.createdAt.toISOString(),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const body = await request.json();
    const product = await prisma.product.create({
      data: {
        name: body.name,
        sku: body.sku,
        barcode: body.barcode ?? null,
        qrCode: body.qrCode ?? null,
        description: body.description ?? null,
        uom: body.uom ?? "pcs",
        costPrice: body.costPrice ?? 0,
        sellingPrice: body.sellingPrice ?? 0,
        discountPercent: body.discountPercent ?? null,
        minStockLevel: body.minStockLevel ?? 10,
        maxStockLevel: body.maxStockLevel ?? null,
        imageUrl: body.imageUrl ?? null,
        status: body.status ?? "ACTIVE",
        categoryId: body.categoryId ?? null,
        supplierId: body.supplierId ?? null,
      },
    });

    return NextResponse.json({
      ...product,
      costPrice: Number(product.costPrice),
      sellingPrice: Number(product.sellingPrice),
      totalStock: 0,
      totalReserved: 0,
      totalAvailable: 0,
      inventories: [],
      createdAt: product.createdAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
