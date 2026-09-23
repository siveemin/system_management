import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });
    const { id } = await params;

    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        sourceWarehouse: true,
        destinationWarehouse: true,
        requestedBy: true,
        sentBy: true,
        receivedBy: true,
        items: { include: { product: true } },
      },
    });

    if (!transfer) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      id: transfer.id,
      transferNumber: transfer.transferNumber,
      sourceWarehouseId: transfer.sourceWarehouseId,
      sourceWarehouseName: (transfer as any).sourceWarehouse.name,
      destinationWarehouseId: transfer.destinationWarehouseId,
      destinationWarehouseName: (transfer as any).destinationWarehouse.name,
      status: transfer.status,
      requestedById: transfer.requestedById,
      requestedByName: (transfer as any).requestedBy?.name ?? null,
      sentById: transfer.sentById,
      sentByName: (transfer as any).sentBy?.name ?? null,
      receivedById: transfer.receivedById,
      receivedByName: (transfer as any).receivedBy?.name ?? null,
      sentDate: transfer.sentDate?.toISOString() ?? null,
      receivedDate: transfer.receivedDate?.toISOString() ?? null,
      notes: transfer.notes,
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
    });
  } catch (error) {
    console.error("GET /api/stock-transfers/[id] error:", error);
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

    const transfer = await prisma.stockTransfer.update({
      where: { id },
      data: {
        status: body.status,
        notes: body.notes,
        sentById: body.sentById ?? undefined,
        receivedById: body.receivedById ?? undefined,
        sentDate: body.sentDate ? new Date(body.sentDate) : undefined,
        receivedDate: body.receivedDate ? new Date(body.receivedDate) : undefined,
      },
    });

    return NextResponse.json({
      ...transfer,
      createdAt: transfer.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("PUT /api/stock-transfers/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
