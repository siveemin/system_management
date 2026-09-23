import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const warehouses = await prisma.warehouse.findMany({
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(warehouses.map((w: any) => ({
      ...w,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
    })));
  } catch (error) {
    console.error("GET /api/warehouses error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const body = await request.json();
    const warehouse = await prisma.warehouse.create({
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

    return NextResponse.json({
      ...warehouse,
      createdAt: warehouse.createdAt.toISOString(),
      updatedAt: warehouse.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/warehouses error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
