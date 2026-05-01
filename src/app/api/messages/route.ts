import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get("otherUserId");

    if (!otherUserId) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: session.user.id, recipientId: otherUserId },
          { senderId: otherUserId, recipientId: session.user.id },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data: messages });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Diagnostic: Vérifier si le modèle existe sur l'objet prisma
    const availableModels = Object.keys(prisma).filter(k => !k.startsWith("_"));
    console.log("[MESSAGES API] Modèles disponibles:", availableModels);

    if (!(prisma as any).directMessage) {
      throw new Error("Le modèle 'directMessage' n'est pas encore chargé dans l'instance Prisma. Essayez de redémarrer le serveur dev.");
    }

    const { recipientId, content } = await req.json();

    if (!recipientId || !content) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const message = await (prisma as any).directMessage.create({
      data: {
        senderId: session.user.id,
        recipientId,
        content,
      },
    });

    return NextResponse.json({ data: message });
  } catch (err: any) {
    console.error("[MESSAGES API] ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
