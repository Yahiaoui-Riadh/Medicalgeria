import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// GET /api/notifications
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = 15;

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id! },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  const hasMore = notifications.length > limit;
  const items = hasMore ? notifications.slice(0, limit) : notifications;
  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id!, isRead: false },
  });

  return NextResponse.json({ data: items, unreadCount, hasMore, nextCursor: hasMore ? items.at(-1)?.id : null });
}

// POST /api/notifications/mark-all-read
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  await prisma.notification.updateMany({
    where: { userId: session.user.id!, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}
