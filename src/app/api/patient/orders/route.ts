import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const createOrderSchema = z.object({
  pharmacyId: z.string().uuid(),
  items: z.array(z.object({
    medicineId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const patientId = (session.user as any).patientId;
    if (!patientId) return NextResponse.json({ error: "Non patient" }, { status: 403 });

    const orders = await prisma.order.findMany({
      where: { patientId },
      include: {
        pharmacy: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            wilaya: true,
            isOnDuty: true,
            openingHours: true,
            geoLocation: true,
            user: { select: { phone: true, email: true } },
          },
        },
        items: {
          include: {
            medicine: { select: { name: true, dci: true, dosage: true, form: true } }
          }
        },
        statusHistory: { orderBy: { changedAt: "asc" } },
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ data: orders });
  } catch (err) {
    console.error("[GET /api/patient/orders]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const patientId = (session.user as any).patientId;
    if (!patientId) return NextResponse.json({ error: "Non patient" }, { status: 403 });

    const body = await req.json();
    const { pharmacyId, items } = createOrderSchema.parse(body);

    // 1. Créer la commande dans une transaction
    const order = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData = [];

      for (const item of items) {
        // Trouver le stock le plus ancien (FEFO/FIFO)
        const stock = await tx.stock.findFirst({
          where: {
            pharmacyId,
            medicineId: item.medicineId,
            quantity: { gte: item.quantity },
            deletedAt: null
          },
          orderBy: { expirationDate: "asc" }
        });

        if (!stock) {
          throw new Error(`Stock insuffisant pour l'un des produits.`);
        }

        const subtotal = Number(stock.sellingPrice) * item.quantity;
        totalAmount += subtotal;

        // Préparer l'item
        orderItemsData.push({
          stockId: stock.id,
          medicineId: item.medicineId,
          quantity: item.quantity,
          unitPrice: stock.sellingPrice,
        });

        // Déduire du stock
        await tx.stock.update({
          where: { id: stock.id },
          data: { 
            quantity: { decrement: item.quantity },
            isLowStock: (stock.quantity - item.quantity) <= 10
          }
        });
      }

      // Créer l'entête de commande
      const newOrder = await tx.order.create({
        data: {
          patientId,
          pharmacyId,
          totalAmount: new Prisma.Decimal(totalAmount),
          status: "PENDING",
          items: {
            create: orderItemsData
          },
          statusHistory: {
            create: {
              status: "PENDING",
              changedBy: session.user!.id!,
              note: "Commande initiée par le patient"
            }
          }
        },
        include: {
          items: { include: { medicine: true } },
          pharmacy: true
        }
      });

      return newOrder;
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/patient/orders]", err);
    if (err instanceof z.ZodError) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    return NextResponse.json({ error: err.message || "Erreur serveur" }, { status: 500 });
  }
}
