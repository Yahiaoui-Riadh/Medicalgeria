import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const currentUserId = session.user.id as string;

    // Trouver tous les messages liés à cet utilisateur
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { recipientId: currentUserId },
        ],
      },
      include: {
        sender: { select: { id: true, email: true, patient: { select: { fullName: true } }, pharmacy: { select: { name: true } } } },
        recipient: { select: { id: true, email: true, patient: { select: { fullName: true } }, pharmacy: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Grouper par "autre utilisateur" pour avoir une liste de conversations
    const conversationsMap = new Map();
    
    messages.forEach(msg => {
      const otherUser = msg.senderId === currentUserId ? msg.recipient : msg.sender;
      if (!conversationsMap.has(otherUser.id)) {
        conversationsMap.set(otherUser.id, {
          userId: otherUser.id,
          name: otherUser.patient?.fullName || otherUser.pharmacy?.name || otherUser.email,
          lastMessage: msg.content,
          createdAt: msg.createdAt,
          isRead: msg.recipientId === currentUserId ? msg.isRead : true
        });
      }
    });

    return NextResponse.json({ data: Array.from(conversationsMap.values()) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
