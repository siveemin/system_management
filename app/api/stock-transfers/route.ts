import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const transfers = await prisma.stockTransfer.findMany({
      include: {
        sourceWarehouse: true,
        destinationWarehouse: true,
        requestedBy: true,
        sentBy: true,
        receivedBy: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(transfers.map((t: any) => ({
      id: t.id,
      transferNumber: t.transferNumber,
      sourceWarehouseId: t.sourceWarehouseId,
      sourceWarehouseName: t.sourceWarehouse.name,
      destinationWarehouseId: t.destinationWarehouseId,
      destinationWarehouseName: t.destinationWarehouse.name,
      status: t.status,
      requestedById: t.requestedById,
      requestedByName: t.requestedBy?.name ?? null,
      sentById: t.sentById,
      sentByName: t.sentBy?.name ?? null,
      receivedById: t.receivedById,
      receivedByName: t.receivedBy?.name ?? null,
      sentDate: t.sentDate?.toISOString() ?? null,
      receivedDate: t.receivedDate?.toISOString() ?? null,
      notes: t.notes,
      createdAt: t.createdAt.toISOString(),
      items: t.items.map((item: any) => ({
        id: item.id,
        stockTransferId: item.stockTransferId,
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        requestedQuantity: item.requestedQuantity,
        sentQuantity: item.sentQuantity,
        receivedQuantity: item.receivedQuantity,
      })),
    })));
  } catch (error) {
    console.error("GET /api/stock-transfers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const body = await request.json();
    const transfer = await prisma.stockTransfer.create({
      data: {
        transferNumber: body.transferNumber,
        sourceWarehouseId: body.sourceWarehouseId,
        destinationWarehouseId: body.destinationWarehouseId,
        status: body.status ?? "DRAFT",
        requestedById: body.requestedById ?? null,
        sentById: body.sentById ?? null,
        receivedById: body.receivedById ?? null,
        sentDate: body.sentDate ? new Date(body.sentDate) : null,
        receivedDate: body.receivedDate ? new Date(body.receivedDate) : null,
        notes: body.notes ?? null,
        items: {
          create: (body.items ?? []).map((item: any) => ({
            productId: item.productId,
            requestedQuantity: item.requestedQuantity,
            sentQuantity: item.sentQuantity ?? 0,
            receivedQuantity: item.receivedQuantity ?? 0,
          })),
        },
      },
      include: {
        sourceWarehouse: true,
        destinationWarehouse: true,
        items: { include: { product: true } },
      },
    });

    return NextResponse.json({
      id: transfer.id,
      transferNumber: transfer.transferNumber,
      sourceWarehouseId: transfer.sourceWarehouseId,
      sourceWarehouseName: (transfer as any).sourceWarehouse.name,
      destinationWarehouseId: transfer.destinationWarehouseId,
      destinationWarehouseName: (transfer as any).destinationWarehouse.name,
      status: transfer.status,
      createdAt: transfer.createdAt.toISOString(),
      items: (transfer as any).items.map((item: any) => ({
        id: item.id,
        stockTransferId: item.stockTransferId,
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        requestedQuantity: item.requestedQuantity,
        sentQuantity: item.sentQuantity,
        receivedQuantity: item.receivedQuantity,
      })),
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/stock-transfers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
