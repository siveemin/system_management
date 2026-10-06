import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });
    const { id } = await params;
    const body = await request.json();
    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: {
        name: body.name,
        code: body.code,
        address: body.address ?? null,
        city: body.city ?? null,
        country: body.country ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        managerName: body.managerName ?? null,
        status: body.status ?? "ACTIVE",
      },
    });
    return NextResponse.json({ ...warehouse, createdAt: warehouse.createdAt.toISOString(), updatedAt: warehouse.updatedAt.toISOString() });
  } catch (error) {
    console.error("PUT /api/warehouses/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });
    const { id } = await params;
    await prisma.warehouse.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/warehouses/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
