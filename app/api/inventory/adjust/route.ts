import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const body = await request.json();
    const { productId, warehouseId, quantityChange, type, notes } = body;

    if (!productId || !warehouseId || quantityChange === undefined) {
      return NextResponse.json({ error: "productId, warehouseId, quantityChange are required" }, { status: 400 });
    }

    const inv = await prisma.productInventory.upsert({
      where: { productId_warehouseId: { productId, warehouseId } },
      create: { productId, warehouseId, quantity: Math.max(0, quantityChange), reservedQuantity: 0 },
      update: { quantity: { increment: quantityChange } },
    });

    await prisma.auditLog.create({
      data: {
        action: type ?? (quantityChange >= 0 ? "STOCK_IN" : "STOCK_OUT"),
        resourceType: "ProductInventory",
        resourceId: inv.id,
        description: `${quantityChange >= 0 ? "+" : ""}${quantityChange} units${notes ? ` — ${notes}` : ""}`,
        metadata: JSON.stringify({ productId, warehouseId, quantityChange }),
      },
    });

    return NextResponse.json({ success: true, quantity: inv.quantity });
  } catch (error) {
    console.error("POST /api/inventory/adjust error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
