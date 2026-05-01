import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

async function getOrderAndCheck(orderId: string, pharmacyId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { stock: true, medicine: true } },
      patient: { select: { userId: true, fullName: true } },
    },
  });
  if (!order) return { error: "Commande introuvable", status: 404 };
  if (order.pharmacyId !== pharmacyId) return { error: "Interdit", status: 403 };
  return { order };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const pharmacyId = (session.user as any).pharmacyId;
  if (!pharmacyId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const { id: orderId, action } = await params;

  const { order, error, status } = (await getOrderAndCheck(orderId, pharmacyId)) as any;
  if (error) return NextResponse.json({ error }, { status });

  try {
    if (action === "validate") {
      if (order.status !== "PENDING")
        return NextResponse.json({ error: "Statut invalide" }, { status: 409 });

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { status: "PREPARING", prescriptionValidatedAt: new Date() },
        });
        await tx.orderStatusHistory.create({
          data: { orderId, status: "PREPARING", changedBy: session.user!.id! },
        });
        await tx.notification.create({
          data: {
            userId: order.patient.userId,
            type: "ORDER_CONFIRMED",
            title: "Commande confirmée ✅",
            message: "Votre commande a été validée. La pharmacie la prépare.",
            data: { orderId },
          },
        });
      });
    } else if (action === "refuse") {
      const body = await req.json().catch(() => ({}));
      const { reason } = z.object({ reason: z.string().min(5) }).parse(body);
      if (!["PENDING", "PREPARING"].includes(order.status))
        return NextResponse.json({ error: "Statut invalide" }, { status: 409 });

      await prisma.$transaction(async (tx) => {
        // Remettre le stock (il a été déduit à la réservation)
        for (const item of order.items) {
          await tx.stock.update({
            where: { id: item.stockId },
            data: {
              quantity: { increment: item.quantity },
              isVisible: true,
            },
          });
        }
        await tx.order.update({
          where: { id: orderId },
          data: { status: "REFUSED", pharmacistNote: reason },
        });
        await tx.orderStatusHistory.create({
          data: { orderId, status: "REFUSED", changedBy: session.user!.id!, note: reason },
        });
        await tx.notification.create({
          data: {
            userId: order.patient.userId,
            type: "ORDER_REFUSED",
            title: "Commande refusée ❌",
            message: `Votre commande a été refusée : ${reason}`,
            data: { orderId },
          },
        });
      });
    } else if (action === "ready") {
      if (order.status !== "PREPARING")
        return NextResponse.json({ error: "Statut invalide" }, { status: 409 });

      const pickupCode = Math.random().toString(36).slice(2, 8).toUpperCase();

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { status: "READY", pharmacistNote: `Code retrait: ${pickupCode}` },
        });
        await tx.orderStatusHistory.create({
          data: {
            orderId,
            status: "READY",
            changedBy: session.user!.id!,
            note: `Code: ${pickupCode}`,
          },
        });
        await tx.notification.create({
          data: {
            userId: order.patient.userId,
            type: "ORDER_READY",
            title: "Commande prête ! 🎉",
            message: `Venez récupérer votre commande. Code de retrait : ${pickupCode}`,
            data: { orderId, pickupCode },
          },
        });
      });
    } else if (action === "deliver") {
      if (order.status !== "READY")
        return NextResponse.json({ error: "Statut invalide" }, { status: 409 });

      await prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id: orderId }, data: { status: "DELIVERED" } });
        await tx.orderStatusHistory.create({
          data: { orderId, status: "DELIVERED", changedBy: session.user!.id! },
        });
        await tx.notification.create({
          data: {
            userId: order.patient.userId,
            type: "ORDER_DELIVERED",
            title: "Commande livrée 💊",
            message: "Merci ! Votre commande a été récupérée avec succès.",
            data: { orderId },
          },
        });
      });
    } else {
      return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
    }

    const updated = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        patient: { select: { fullName: true, userId: true } },
        items: { include: { medicine: { select: { name: true } } } },
        statusHistory: { orderBy: { changedAt: "desc" }, take: 3 },
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    if (err.name === "ZodError")
      return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 });
    console.error("[PATCH /api/pharmacy/orders/:id/:action]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
