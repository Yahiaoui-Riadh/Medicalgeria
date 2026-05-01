import { Meilisearch } from "meilisearch";

const globalForMeili = globalThis as unknown as {
  meili: Meilisearch | undefined;
};

export const meili =
  globalForMeili.meili ??
  new Meilisearch({
    host: process.env.MEILISEARCH_HOST ?? "http://localhost:7700",
    apiKey: process.env.MEILISEARCH_API_KEY ?? "masterKey",
  });

if (process.env.NODE_ENV !== "production") globalForMeili.meili = meili;

export const INDICES = {
  MEDICINES: "medicines",
  PHARMACIES: "pharmacies",
} as const;

export async function initSearchIndices() {
  try {
    // Index médicaments
    await meili.index(INDICES.MEDICINES).updateSettings({
      searchableAttributes: ["name", "dci", "laboratory", "category"],
      filterableAttributes: ["category", "isPrescriptionRequired", "isRemboursable"],
      sortableAttributes: ["name"],
      typoTolerance: { minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 } },
    });

    // Index pharmacies
    await meili.index(INDICES.PHARMACIES).updateSettings({
      searchableAttributes: ["name", "address", "city", "wilaya"],
      filterableAttributes: ["wilaya", "isVerified"],
    });

    console.log("✅ Meilisearch indices initialisés");
  } catch (err) {
    console.error("❌ Erreur init Meilisearch:", err);
  }
}

export default meili;
