import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const pharmacyId = (session.user as any).pharmacyId;
    if (!pharmacyId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const hasPrescription = searchParams.get("hasPrescription") === "true";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const cursor = searchParams.get("cursor");
    const limit = 20;

    const where: any = {
      pharmacyId,
      ...(status && { status }),
      ...(hasPrescription && { prescriptionImageUrl: { not: null } }),
      ...((dateFrom || dateTo) && {
        createdAt: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        },
      }),
    };

    const orders = await prisma.order.findMany({
      where,
      include: {
        patient: {
          select: {
            fullName: true,
            userId: true,
            address: true,
            dateOfBirth: true,
            emergencyContact: true,
            geoLocation: true,
            user: { select: { phone: true, email: true } },
          },
        },
        items: {
          include: {
            medicine: { select: { name: true, dci: true, dosage: true, isPrescriptionRequired: true } },
          },
        },
        statusHistory: { orderBy: { changedAt: "desc" }, take: 1 },
      },
      orderBy: [{ createdAt: "desc" }],
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = orders.length > limit;
    const items = hasMore ? orders.slice(0, limit) : orders;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({ data: items, nextCursor, hasMore });
  } catch (err) {
    console.error("[GET /api/pharmacy/orders]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
