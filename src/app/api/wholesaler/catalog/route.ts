import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    
    const wholesalerId = (session.user as any).wholesalerId;
    if (!wholesalerId) return NextResponse.json({ error: "Non grossiste" }, { status: 403 });

    const catalog = await prisma.wholesalerCatalog.findMany({
      where: { wholesalerId },
      include: {
        medicine: {
          select: {
            name: true,
            dci: true,
            dosage: true,
            codeCIP: true
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json({ data: catalog });
  } catch (err) {
    console.error("[GET /api/wholesaler/catalog]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    
    const wholesalerId = (session.user as any).wholesalerId;
    if (!wholesalerId) return NextResponse.json({ error: "Non grossiste" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    // Vérifier que l'item appartient au grossiste
    const item = await prisma.wholesalerCatalog.findUnique({
      where: { id }
    });

    if (!item || item.wholesalerId !== wholesalerId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await prisma.wholesalerCatalog.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/wholesaler/catalog]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
