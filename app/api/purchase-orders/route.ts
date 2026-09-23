import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const orders = await prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        warehouse: true,
        createdBy: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders.map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      supplierId: o.supplierId,
      supplierName: o.supplier.name,
      warehouseId: o.warehouseId,
      warehouseName: o.warehouse.name,
      orderDate: o.orderDate.toISOString(),
      expectedDeliveryDate: o.expectedDeliveryDate?.toISOString() ?? null,
      status: o.status,
      totalAmount: Number(o.totalAmount),
      notes: o.notes,
      createdById: o.createdById,
      createdByName: o.createdBy?.name ?? null,
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((item: any) => ({
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
    })));
  } catch (error) {
    console.error("GET /api/purchase-orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const body = await request.json();
    const order = await prisma.purchaseOrder.create({
      data: {
        orderNumber: body.orderNumber,
        supplierId: body.supplierId,
        warehouseId: body.warehouseId,
        orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
        expectedDeliveryDate: body.expectedDeliveryDate ? new Date(body.expectedDeliveryDate) : null,
        status: body.status ?? "DRAFT",
        totalAmount: body.totalAmount ?? 0,
        notes: body.notes ?? null,
        createdById: body.createdById ?? null,
        items: {
          create: (body.items ?? []).map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            receivedQuantity: item.receivedQuantity ?? 0,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
          })),
        },
      },
      include: {
        supplier: true,
        warehouse: true,
        items: { include: { product: true } },
      },
    });

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      supplierId: order.supplierId,
      supplierName: (order as any).supplier.name,
      warehouseId: order.warehouseId,
      warehouseName: (order as any).warehouse.name,
      orderDate: order.orderDate.toISOString(),
      status: order.status,
      totalAmount: Number(order.totalAmount),
      notes: order.notes,
      createdById: order.createdById,
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
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/purchase-orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
