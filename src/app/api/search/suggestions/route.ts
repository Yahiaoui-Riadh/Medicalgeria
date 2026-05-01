import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import meili, { INDICES } from "@/lib/meilisearch";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";

    if (!q.trim() || q.length < 2) {
      return NextResponse.json({ data: [] });
    }

    let suggestions: string[] = [];
    let usedMeili = false;

    // 1. Essayer Meilisearch pour des suggestions avec typo-tolérance
    try {
      const searchResult = await meili.index(INDICES.MEDICINES).search(q, {
        limit: 8,
        attributesToRetrieve: ["name", "dci"],
      });
      
      if (searchResult.hits.length > 0) {
        suggestions = searchResult.hits.map((h: any) => h.name);
        usedMeili = true;
      }
    } catch (meiliErr) {
      console.warn("⚠️ Meilisearch suggestions indisponible:", (meiliErr as any).message);
    }

    // 2. Fallback sur Prisma (recherche exacte par début de mot)
    if (!usedMeili) {
      const medicines = await prisma.medicine.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { dci: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { name: true },
        distinct: ['name'],
        take: 8,
      });
      suggestions = medicines.map(m => m.name);
    }

    // Supprimer les doublons et limiter
    const uniqueSuggestions = Array.from(new Set(suggestions)).slice(0, 8);

    return NextResponse.json({ 
      data: uniqueSuggestions,
      meta: { provider: usedMeili ? "meilisearch" : "prisma" }
    });
  } catch (err: any) {
    return NextResponse.json({ data: [] });
  }
}
