import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q || q.length < 2) return NextResponse.json({ products: [], customers: [], suppliers: [], warehouses: [] });
  if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  const [products, customers, suppliers, warehouses] = await Promise.all([
    prisma.product.findMany({
      where: { OR: [{ name: { contains: q } }, { sku: { contains: q } }, { barcode: { contains: q } }] },
      include: { category: true, inventories: true },
      take: 6,
    }),
    prisma.customer.findMany({
      where: { OR: [{ name: { contains: q } }, { email: { contains: q } }] },
      take: 4,
    }),
    prisma.supplier.findMany({
      where: { OR: [{ name: { contains: q } }, { contactPerson: { contains: q } }] },
      take: 4,
    }),
    prisma.warehouse.findMany({
      where: { OR: [{ name: { contains: q } }, { code: { contains: q } }] },
      take: 3,
    }),
  ]);

  return NextResponse.json({
    products: products.map((p: any) => ({
      id: p.id, name: p.name, sku: p.sku, barcode: p.barcode,
      categoryName: p.category?.name ?? null, uom: p.uom,
      totalStock: p.inventories.reduce((s: number, i: any) => s + i.quantity, 0),
    })),
    customers: customers.map((c: any) => ({ id: c.id, name: c.name, email: c.email })),
    suppliers: suppliers.map((s: any) => ({ id: s.id, name: s.name, contactPerson: s.contactPerson })),
    warehouses: warehouses.map((w: any) => ({ id: w.id, name: w.name, code: w.code, address: w.address })),
  });
}
