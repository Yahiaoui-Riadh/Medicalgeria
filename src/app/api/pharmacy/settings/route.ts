import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const pharmacy = await prisma.pharmacy.findUnique({
      where: { userId: session.user.id },
      include: { user: { select: { phone: true, email: true } } }
    });

    if (!pharmacy) return NextResponse.json({ error: "Pharmacie non trouvée" }, { status: 404 });

    return NextResponse.json({ data: pharmacy });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const body = await req.json();
    const { name, address, geoLocation, openingHours, isOnDuty, phone, email } = body;

    const updatedPharmacy = await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour le profil pharmacie
      const pharmacy = await tx.pharmacy.update({
        where: { userId: session.user.id },
        data: {
          name,
          address,
          geoLocation,
          openingHours,
          isOnDuty,
        },
      });

      // 2. Mettre à jour les infos utilisateur (email/phone)
      await tx.user.update({
        where: { id: session.user.id },
        data: { 
          email, 
          phone,
        },
      });

      return pharmacy;
    });

    return NextResponse.json({ data: updatedPharmacy });
  } catch (err: any) {
    console.error("[SETTINGS API] ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
