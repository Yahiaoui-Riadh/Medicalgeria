const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { Meilisearch } = require('meilisearch'); // Correction de la casse : Meilisearch et non MeiliSearch
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const client = new Meilisearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY || 'masterKey',
});

async function main() {
  console.log('🚀 Synchronisation Meilisearch...');
  
  const index = client.index('medicines');

  // 1. Configuration de l'index
  await index.updateSettings({
    searchableAttributes: ['name', 'dci', 'laboratory', 'designation2', 'category'],
    filterableAttributes: ['isFrigo', 'isRemboursable', 'isPsychotropic', 'category', 'laboratory'],
    sortableAttributes: ['name', 'ppa'],
    rankingRules: [
      'words',
      'typo',
      'proximity',
      'attribute',
      'sort',
      'exactness'
    ]
  });
  console.log('✅ Configuration de l\'index terminée.');

  // 2. Récupération des médicaments par lots
  const batchSize = 10000;
  let skip = 0;
  let totalSync = 0;

  while (true) {
    const medicines = await prisma.medicine.findMany({
      skip,
      take: batchSize,
      select: {
        id: true,
        name: true,
        dci: true,
        dosage: true,
        form: true,
        laboratory: true,
        category: true,
        isFrigo: true,
        isRemboursable: true,
        isPsychotropic: true,
        ppa: true,
        designation2: true
      }
    });

    if (medicines.length === 0) break;

    const documents = medicines.map(m => ({
      ...m,
      ppa: m.ppa ? Number(m.ppa) : 0
    }));

    const task = await index.addDocuments(documents);
    totalSync += medicines.length;
    console.log(`📦 ${totalSync} médicaments envoyés à Meilisearch (Task UID: ${task.taskUid})...`);
    
    skip += batchSize;
  }

  console.log(`🏁 Synchronisation terminée ! Total : ${totalSync} documents.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
