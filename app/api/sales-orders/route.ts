import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const orders = await prisma.salesOrder.findMany({
      include: {
        customer: true,
        warehouse: true,
        createdBy: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders.map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerId: o.customerId,
      customerName: o.customer.name,
      warehouseId: o.warehouseId,
      warehouseName: o.warehouse.name,
      orderDate: o.orderDate.toISOString(),
      deliveryDate: o.deliveryDate?.toISOString() ?? null,
      status: o.status,
      subtotal: Number(o.subtotal),
      discount: Number(o.discount),
      tax: Number(o.tax),
      totalAmount: Number(o.totalAmount),
      notes: o.notes,
      createdById: o.createdById,
      createdByName: o.createdBy?.name ?? null,
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((item: any) => ({
        id: item.id,
        salesOrderId: item.salesOrderId,
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalAmount: Number(item.totalAmount),
      })),
    })));
  } catch (error) {
    console.error("GET /api/sales-orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const body = await request.json();
    const order = await prisma.salesOrder.create({
      data: {
        orderNumber: body.orderNumber,
        customerId: body.customerId,
        warehouseId: body.warehouseId,
        orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
        status: body.status ?? "DRAFT",
        subtotal: body.subtotal ?? 0,
        discount: body.discount ?? 0,
        tax: body.tax ?? 0,
        totalAmount: body.totalAmount ?? 0,
        notes: body.notes ?? null,
        createdById: body.createdById ?? null,
        items: {
          create: (body.items ?? []).map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalAmount: item.totalAmount,
          })),
        },
      },
      include: {
        customer: true,
        warehouse: true,
        items: { include: { product: true } },
      },
    });

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
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/sales-orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
