import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const customers = await prisma.customer.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(customers.map((c: any) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })));
  } catch (error) {
    console.error("GET /api/customers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const body = await request.json();
    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        contactPerson: body.contactPerson ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
        address: body.address ?? null,
        city: body.city ?? null,
        country: body.country ?? null,
        status: body.status ?? "ACTIVE",
        notes: body.notes ?? null,
      },
    });

    return NextResponse.json({
      ...customer,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/customers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
