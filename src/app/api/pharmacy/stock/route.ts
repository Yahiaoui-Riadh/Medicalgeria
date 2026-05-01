import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const createSchema = z.object({
  medicineId: z.string().uuid(),
  quantity: z.number().int().min(0),
  purchasePrice: z.number().positive(),
  sellingPrice: z.number().positive(),
  expirationDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  batchNumber: z.string().optional(),
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

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const pharmacyId = (session.user as any).pharmacyId;
    if (!pharmacyId) return NextResponse.json({ error: "Non pharmacien" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const lowStock = searchParams.get("lowStock") === "true";
    const expiringSoon = searchParams.get("expiringSoon") === "true";
    const category = searchParams.get("category") ?? "";
    const cursor = searchParams.get("cursor");
    const limit = 20;

    const where: any = {
      pharmacyId,
      deletedAt: null,
      ...(lowStock && { isLowStock: true }),
      ...(expiringSoon && { isExpiringSoon: true }),
      ...(search && {
        medicine: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { dci: { contains: search, mode: "insensitive" } },
          ],
        },
      }),
      ...(category && { medicine: { category: { contains: category, mode: "insensitive" } } }),
    };

    const stocks = await prisma.stock.findMany({
      where,
      include: {
        medicine: {
          select: { id: true, name: true, dci: true, dosage: true, form: true, category: true, isPrescriptionRequired: true, isFrigo: true, codeCIP: true },
        },
      },
      orderBy: [{ expirationDate: "asc" }, { medicine: { name: "asc" } }],
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = stocks.length > limit;
    const items = hasMore ? stocks.slice(0, limit) : stocks;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({ data: items, nextCursor, hasMore });
  } catch (err) {
    console.error("[GET /api/pharmacy/stock]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    
    const pharmacyId = (session.user as any).pharmacyId;
    if (!pharmacyId) {
      return NextResponse.json({ error: "Action réservée aux pharmaciens" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Données JSON invalides" }, { status: 400 });
    }

    const result = createSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Données invalides", details: result.error.format() }, { status: 400 });
    }
    const data = result.data;

    const expDate = new Date(data.expirationDate);
    const minAllowed = new Date();
    minAllowed.setDate(minAllowed.getDate() + 30);

    if (expDate <= minAllowed) {
      return NextResponse.json({ error: "La date d'expiration doit être supérieure à 30 jours." }, { status: 400 });
    }

    const margin = (data.sellingPrice - data.purchasePrice) / data.purchasePrice;
    if (margin < 0.10) {
      return NextResponse.json({ error: "La marge bénéficiaire doit être d'au moins 10%." }, { status: 400 });
    }

    const existing = await prisma.stock.findFirst({
      where: { pharmacyId, medicineId: data.medicineId, batchNumber: data.batchNumber ?? null, deletedAt: null },
    });
    if (existing) {
      return NextResponse.json({ error: "Ce lot de médicament est déjà présent dans votre stock." }, { status: 409 });
    }

    const flags = computeFlags(data.quantity, expDate);
    const stock = await prisma.$transaction(async (tx) => {
      const s = await tx.stock.create({
        data: {
          pharmacyId,
          medicineId: data.medicineId,
          quantity: data.quantity,
          purchasePrice: new Prisma.Decimal(data.purchasePrice),
          sellingPrice: new Prisma.Decimal(data.sellingPrice),
          expirationDate: expDate,
          batchNumber: data.batchNumber ?? null,
          ...flags,
        },
        include: { medicine: true },
      });
      await tx.auditLog.create({
        data: {
          userId: session.user!.id!,
          entityType: "Stock",
          entityId: s.id,
          action: "STOCK_CREATED",
          newValue: { quantity: data.quantity, medicineId: data.medicineId },
        },
      });
      return s;
    });

    return NextResponse.json({ success: true, data: stock }, { status: 201 });

  } catch (err: any) {
    console.error("[POST /api/pharmacy/stock] Error:", err);
    return NextResponse.json({ error: "Une erreur interne est survenue" }, { status: 500 });
  }
}


