import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const patchSchema = z.object({
  quantity: z.number().int().min(0).optional(),
  sellingPrice: z.number().positive().optional(),
  purchasePrice: z.number().positive().optional(),
  isVisible: z.boolean().optional(),
  expirationDate: z.string().optional(),
});

function computeFlags(qty: number, expDate: Date) {
  const now = new Date();
  const threeMonths = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    isLowStock: qty <= 10,
    isExpiringSoon: expDate < threeMonths && expDate > now,
    isVisible: expDate > thirtyDays && qty > 0,
  };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const pharmacyId = (session.user as any).pharmacyId;
    if (!pharmacyId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

    const stock = await prisma.stock.findUnique({ where: { id, deletedAt: null } });
    if (!stock) return NextResponse.json({ error: "Stock introuvable" }, { status: 404 });
    if (stock.pharmacyId !== pharmacyId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

    const body = await req.json();
    const data = patchSchema.parse(body);

    const purchasePrice = data.purchasePrice ?? Number(stock.purchasePrice);
    const sellingPrice = data.sellingPrice ?? Number(stock.sellingPrice);
    if (data.sellingPrice || data.purchasePrice) {
      const margin = (sellingPrice - purchasePrice) / purchasePrice;
      if (margin < 0.10) return NextResponse.json({ error: "Marge insuffisante (min. 10%)" }, { status: 400 });
    }

    if (data.expirationDate) {
      const expDate = new Date(data.expirationDate);
      if (expDate <= new Date()) return NextResponse.json({ error: "Date expiration invalide" }, { status: 400 });
    }

    const oldValue = { quantity: stock.quantity, sellingPrice: stock.sellingPrice };
    const expDate = data.expirationDate ? new Date(data.expirationDate) : stock.expirationDate;
    const qty = data.quantity ?? stock.quantity;
    const flags = computeFlags(qty, expDate);

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.stock.update({
        where: { id },
        data: {
          ...(data.quantity !== undefined && { quantity: data.quantity }),
          ...(data.sellingPrice !== undefined && { sellingPrice: new Prisma.Decimal(data.sellingPrice) }),
          ...(data.purchasePrice !== undefined && { purchasePrice: new Prisma.Decimal(data.purchasePrice) }),
          ...(data.expirationDate !== undefined && { expirationDate: new Date(data.expirationDate) }),
          ...(data.isVisible !== undefined && { isVisible: data.isVisible }),
          ...flags,
        },
        include: { medicine: { select: { name: true, dci: true } } },
      });
      if (data.quantity !== undefined) {
        await tx.auditLog.create({
          data: {
            userId: session.user!.id!,
            entityType: "Stock",
            entityId: id,
            action: "UPDATE_QUANTITY",
            oldValue: oldValue as any,
            newValue: { quantity: data.quantity, sellingPrice: sellingPrice } as any,
          },
        });
      }
      return s;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    if (err.name === "ZodError") return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    console.error("[PATCH /api/pharmacy/stock/:id]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const pharmacyId = (session.user as any).pharmacyId;
    if (!pharmacyId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

    const stock = await prisma.stock.findUnique({ where: { id, deletedAt: null } });
    if (!stock) return NextResponse.json({ error: "Stock introuvable" }, { status: 404 });
    if (stock.pharmacyId !== pharmacyId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

    await prisma.$transaction(async (tx) => {
      await tx.stock.update({ where: { id }, data: { deletedAt: new Date() } });
      await tx.auditLog.create({
        data: {
          userId: session.user!.id!,
          entityType: "Stock", entityId: id, action: "STOCK_DELETED",
          oldValue: { quantity: stock.quantity } as any,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/pharmacy/stock/:id]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
