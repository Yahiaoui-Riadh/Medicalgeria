import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const bulkSchema = z.array(z.object({
  codeCIP: z.string(),
  quantity: z.number().int().min(0),
  purchasePrice: z.number().positive(),
  sellingPrice: z.number().positive(),
  expirationDate: z.string(),
}));

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const pharmacyId = (session.user as any).pharmacyId;
    if (!pharmacyId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

    const body = await req.json();
    const items = bulkSchema.parse(body);

    const results = {
      created: 0,
      updated: 0,
      errors: 0,
    };

    // On traite les items en série ou petits batchs pour éviter les timeouts
    for (const item of items) {
      try {
        // 1. Trouver le médicament par Code CIP
        const medicine = await prisma.medicine.findUnique({
          where: { codeCIP: item.codeCIP }
        });

        if (!medicine) {
          results.errors++;
          continue;
        }

        // 2. Chercher si un stock existe déjà pour ce médicament dans cette pharmacie
        const existingStock = await prisma.stock.findFirst({
          where: {
            pharmacyId,
            medicineId: medicine.id,
            deletedAt: null
          }
        });

        if (existingStock) {
          // Mise à jour
          await prisma.stock.update({
            where: { id: existingStock.id },
            data: {
              quantity: item.quantity,
              purchasePrice: item.purchasePrice,
              sellingPrice: item.sellingPrice,
              expirationDate: new Date(item.expirationDate),
              isVisible: true,
            }
          });
          results.updated++;
        } else {
          // Création
          await prisma.stock.create({
            data: {
              pharmacyId,
              medicineId: medicine.id,
              quantity: item.quantity,
              purchasePrice: item.purchasePrice,
              sellingPrice: item.sellingPrice,
              expirationDate: new Date(item.expirationDate),
              isVisible: true,
            }
          });
          results.created++;
        }
      } catch (err) {
        results.errors++;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error("[POST /api/pharmacy/stock/bulk]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
