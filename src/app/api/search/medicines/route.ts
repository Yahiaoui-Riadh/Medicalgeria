import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import meili, { INDICES } from "@/lib/meilisearch";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const lat = parseFloat(searchParams.get("lat") ?? "36.737");
    const lng = parseFloat(searchParams.get("lng") ?? "3.086");
    const openNow = searchParams.get("openNow") === "true";
    const isOnDuty = searchParams.get("isOnDuty") === "true";
    const inStockOnly = searchParams.get("inStock") === "true";

    if (!q.trim()) {
      return NextResponse.json({ data: [], total: 0 });
    }

    let medicines: any[] = [];
    let useMeili = false;

    // 1. Essayer Meilisearch pour une recherche performante (avec typo-tolerance)
    try {
      const searchResult = await meili.index(INDICES.MEDICINES).search(q, {
        limit: 20,
      });
      
      if (searchResult.hits.length > 0) {
        medicines = searchResult.hits;
        useMeili = true;
      }
    } catch (meiliErr) {
      console.warn("⚠️ Meilisearch indisponible, fallback sur Prisma:", (meiliErr as any).message);
    }

    // 2. Fallback sur Prisma si Meilisearch échoue ou ne trouve rien
    if (!useMeili) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);
      
      medicines = await prisma.medicine.findMany({
        where: {
          OR: [
            ...(isUUID ? [{ id: q }] : []),
            { name: { contains: q, mode: "insensitive" } },
            { dci: { contains: q, mode: "insensitive" } },
            { laboratory: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true, name: true, dci: true, dosage: true, form: true,
          laboratory: true, category: true, conditionnement: true,
          paysOrigine: true, isPrescriptionRequired: true, isPrinceps: true,
          isFrigo: true, isRemboursable: true, shp: true, ppa: true,
          codeCIP: true, description: true, remarque: true, designation2: true
        },
        take: 15,
      });
    }

    if (medicines.length === 0) {
      return NextResponse.json({ data: [], total: 0 });
    }

    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 3. Pour chaque médicament, on cherche les stocks (Logique inchangée)
    const results = await Promise.all(
      medicines.map(async (medicine: any) => {
        const stocks = await prisma.stock.findMany({
          where: {
            medicineId: medicine.id,
            deletedAt: null,
            isVisible: true,
            quantity: { gt: 0 },
            expirationDate: { gt: thirtyDays },
            pharmacy: { 
              isVerified: true,
              ...(isOnDuty && { isOnDuty: true })
            },
          },
          include: {
            pharmacy: {
              select: {
                id: true, name: true, address: true, city: true, wilaya: true,
                geoLocation: true, openingHours: true, isOnDuty: true,
              },
            },
          },
          orderBy: { sellingPrice: "asc" },
        });

        const pharmacies = stocks
          .map((stock) => {
            const geo = stock.pharmacy.geoLocation as any;
            const pLat = geo?.lat || 0;
            const pLng = geo?.lng || 0;
            
            const R = 6371000;
            const dLat = ((pLat - lat) * Math.PI) / 180;
            const dLng = ((pLng - lng) * Math.PI) / 180;
            const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat * Math.PI) / 180) * Math.cos((pLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
            const distance = Math.round(2 * R * Math.asin(Math.sqrt(a)));

            const oh = (stock.pharmacy.openingHours as any) || {};
            const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
            const dayKey = days[new Date().getDay()];
            const todayHours = oh[dayKey] ?? "fermé";
            let isOpen = false;
            if (todayHours !== "fermé" && todayHours.includes("-")) {
              try {
                const [openT, closeT] = todayHours.split("-");
                const [oh2, om] = openT.split(":").map(Number);
                const [ch, cm] = closeT.split(":").map(Number);
                const cur = new Date().getHours() * 60 + new Date().getMinutes();
                isOpen = cur >= oh2 * 60 + om && cur <= ch * 60 + cm;
              } catch(e) {}
            }

            return {
              pharmacyId: stock.pharmacy.id,
              pharmacyName: stock.pharmacy.name,
              address: stock.pharmacy.address,
              city: stock.pharmacy.city,
              distance,
              sellingPrice: Number(stock.sellingPrice),
              quantity: stock.quantity,
              isOpen,
              isOnDuty: stock.pharmacy.isOnDuty,
            };
          })
          .filter((p) => !openNow || p.isOpen)
          .sort((a, b) => a.distance - b.distance);

        return { medicine, pharmacies };
      })
    );

    const filteredResults = inStockOnly ? results.filter(r => r.pharmacies.length > 0) : results;

    return NextResponse.json({ 
      data: filteredResults, 
      total: filteredResults.length,
      meta: { provider: useMeili ? "meilisearch" : "prisma" }
    });
  } catch (err: any) {
    console.error("[GET /api/search/medicines] ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}