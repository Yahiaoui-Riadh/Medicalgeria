import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// GET /api/pharmacy/orders/[id] — détail d'une commande
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const pharmacyId = (session.user as any).pharmacyId;
  if (!pharmacyId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          fullName: true, userId: true, address: true, dateOfBirth: true,
          emergencyContact: true, geoLocation: true,
          user: { select: { phone: true, email: true } },
        },
      },
      items: { include: { medicine: true, stock: { select: { sellingPrice: true } } } },
      statusHistory: { orderBy: { changedAt: "desc" } },
    },
  });

  if (!order) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (order.pharmacyId !== pharmacyId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  return NextResponse.json({ data: order });
}
