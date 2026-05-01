import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";

    if (!q.trim()) return NextResponse.json({ data: [] });

    const pharmacies = await prisma.pharmacy.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { wilaya: { contains: q, mode: "insensitive" } },
        ],
        isVerified: true,
      },
      select: {
        id: true,
        userId: true,
        name: true,
        address: true,
        city: true,
        wilaya: true,
        isOnDuty: true,
      },
      take: 10,
    });

    return NextResponse.json({ data: pharmacies });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
