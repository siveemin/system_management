import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });
    const { id } = await params;

    const p = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
        inventories: { include: { warehouse: true } },
      },
    });

    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const totalStock = p.inventories.reduce((sum: number, inv: any) => sum + inv.quantity, 0);
    const totalReserved = p.inventories.reduce((sum: number, inv: any) => sum + inv.reservedQuantity, 0);

    return NextResponse.json({
      ...p,
      costPrice: Number(p.costPrice),
      sellingPrice: Number(p.sellingPrice),
      categoryName: p.category?.name ?? null,
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
    });
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });
    const { id } = await params;
    const body = await request.json();

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        sku: body.sku,
        barcode: body.barcode ?? null,
        qrCode: body.qrCode ?? null,
        description: body.description ?? null,
        uom: body.uom,
        costPrice: body.costPrice,
        sellingPrice: body.sellingPrice,
        discountPercent: body.discountPercent ?? null,
        minStockLevel: body.minStockLevel,
        maxStockLevel: body.maxStockLevel ?? null,
        imageUrl: body.imageUrl ?? null,
        status: body.status,
        categoryId: body.categoryId ?? null,
        supplierId: body.supplierId ?? null,
      },
    });

    return NextResponse.json({
      ...product,
      costPrice: Number(product.costPrice),
      sellingPrice: Number(product.sellingPrice),
      createdAt: product.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("PUT /api/products/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });
    const { id } = await params;

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
