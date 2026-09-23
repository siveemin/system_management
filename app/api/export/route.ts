import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    if (!prisma) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    switch (type) {
      case "products": {
        const products = await prisma.product.findMany({
          include: { category: true, supplier: true },
          orderBy: { name: "asc" },
        });
        return NextResponse.json(products.map((p: any) => ({
          SKU: p.sku,
          Name: p.name,
          Category: p.category?.name ?? "",
          Supplier: p.supplier?.name ?? "",
          UOM: p.uom,
          "Cost Price": Number(p.costPrice),
          "Selling Price": Number(p.sellingPrice),
          "Min Stock": p.minStockLevel,
          Status: p.status,
        })));
      }

      case "sales-orders": {
        const orders = await prisma.salesOrder.findMany({
          include: { customer: true, warehouse: true },
          orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(orders.map((o: any) => ({
          "Order #": o.orderNumber,
          Customer: o.customer.name,
          Warehouse: o.warehouse.name,
          "Order Date": o.orderDate.toISOString().split("T")[0],
          Status: o.status,
          Subtotal: Number(o.subtotal),
          Discount: Number(o.discount),
          Tax: Number(o.tax),
          Total: Number(o.totalAmount),
        })));
      }

      case "purchase-orders": {
        const orders = await prisma.purchaseOrder.findMany({
          include: { supplier: true, warehouse: true },
          orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(orders.map((o: any) => ({
          "Order #": o.orderNumber,
          Supplier: o.supplier.name,
          Warehouse: o.warehouse.name,
          "Order Date": o.orderDate.toISOString().split("T")[0],
          "Expected Delivery": o.expectedDeliveryDate?.toISOString().split("T")[0] ?? "",
          Status: o.status,
          Total: Number(o.totalAmount),
        })));
      }

      case "inventory": {
        const inventories = await prisma.productInventory.findMany({
          include: { product: true, warehouse: true },
          orderBy: { product: { name: "asc" } },
        });
        return NextResponse.json(inventories.map((inv: any) => ({
          SKU: inv.product.sku,
          Product: inv.product.name,
          Warehouse: inv.warehouse.name,
          "Qty on Hand": inv.quantity,
          Reserved: inv.reservedQuantity,
          Available: inv.quantity - inv.reservedQuantity,
          "Location Bin": inv.locationBin ?? "",
        })));
      }

      default:
        return NextResponse.json({ error: "Invalid type. Use: products, sales-orders, purchase-orders, inventory" }, { status: 400 });
    }
  } catch (error) {
    console.error("GET /api/export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
