import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });
    const { id } = await params;

    const order = await prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        warehouse: true,
        createdBy: true,
        items: { include: { product: true } },
      },
    });

    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: (order as any).customer.name,
      warehouseId: order.warehouseId,
      warehouseName: (order as any).warehouse.name,
      orderDate: order.orderDate.toISOString(),
      deliveryDate: order.deliveryDate?.toISOString() ?? null,
      status: order.status,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      tax: Number(order.tax),
      totalAmount: Number(order.totalAmount),
      notes: order.notes,
      createdById: order.createdById,
      createdByName: (order as any).createdBy?.name ?? null,
      createdAt: order.createdAt.toISOString(),
      items: (order as any).items.map((item: any) => ({
        id: item.id,
        salesOrderId: item.salesOrderId,
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalAmount: Number(item.totalAmount),
      })),
    });
  } catch (error) {
    console.error("GET /api/sales-orders/[id] error:", error);
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

    const order = await prisma.salesOrder.update({
      where: { id },
      data: {
        status: body.status,
        notes: body.notes,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
      },
    });

    return NextResponse.json({
      ...order,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      tax: Number(order.tax),
      totalAmount: Number(order.totalAmount),
      orderDate: order.orderDate.toISOString(),
      createdAt: order.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("PUT /api/sales-orders/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
