import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });
    const { id } = await params;

    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        warehouse: true,
        createdBy: true,
        items: { include: { product: true } },
      },
    });

    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      supplierId: order.supplierId,
      supplierName: (order as any).supplier.name,
      warehouseId: order.warehouseId,
      warehouseName: (order as any).warehouse.name,
      orderDate: order.orderDate.toISOString(),
      expectedDeliveryDate: order.expectedDeliveryDate?.toISOString() ?? null,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      notes: order.notes,
      createdById: order.createdById,
      createdByName: (order as any).createdBy?.name ?? null,
      createdAt: order.createdAt.toISOString(),
      items: (order as any).items.map((item: any) => ({
        id: item.id,
        purchaseOrderId: item.purchaseOrderId,
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        quantity: item.quantity,
        receivedQuantity: item.receivedQuantity,
        unitCost: Number(item.unitCost),
        totalCost: Number(item.totalCost),
      })),
    });
  } catch (error) {
    console.error("GET /api/purchase-orders/[id] error:", error);
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

    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: body.status,
        notes: body.notes,
        expectedDeliveryDate: body.expectedDeliveryDate
          ? new Date(body.expectedDeliveryDate)
          : undefined,
      },
    });

    return NextResponse.json({
      ...order,
      totalAmount: Number(order.totalAmount),
      orderDate: order.orderDate.toISOString(),
      createdAt: order.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("PUT /api/purchase-orders/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
