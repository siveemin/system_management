import { NextRequest, NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const users = await prisma.user.findMany({
      include: { warehouse: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(users.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
      phone: u.phone,
      status: u.status,
      warehouseId: u.warehouseId,
      warehouseName: u.warehouse?.name ?? null,
      createdAt: u.createdAt.toISOString(),
    })));
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const body = await request.json();
    const passwordHash = await bcrypt.hash(body.password || "password123", 10);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        role: body.role ?? "STAFF",
        phone: body.phone ?? null,
        status: body.status ?? "ACTIVE",
        warehouseId: body.warehouseId ?? null,
        avatar: body.avatar ?? null,
      },
    });

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      status: user.status,
      warehouseId: user.warehouseId,
      createdAt: user.createdAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
