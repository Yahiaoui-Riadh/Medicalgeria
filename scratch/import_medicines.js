const { PrismaClient, Prisma } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const XLSX = require('xlsx');
require('dotenv').config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Début de l'importation massive...");
  const filePath = 'F:\\Pharm@lgeria\\medicament.xlsx';
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log(`📊 ${rows.length} lignes trouvées. Traitement en cours...`);

  let count = 0;
  const batchSize = 100; // Smaller batch for stability
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    
    const operations = batch.map(row => {
      const codeCIP = String(row.CodeCIP || '').trim();
      if (!codeCIP || codeCIP === 'NULL') return null;

      const name = row.LibelleProduit || row.Marque || 'Inconnu';
      const dci = row.DCI || 'N/A';
      const dosage = String(row.Dosage || '');
      const form = row.LibelleForme || row.Forme || '';
      const laboratory = row.NomLabo || '';
      const category = row.Categorie || '';
      const presentation = row.LibellePresentation || row.Presentation || '';
      const shpValue = row.SHP && row.SHP !== 'NULL' ? parseFloat(row.SHP) : null;

      return prisma.medicine.upsert({
        where: { codeCIP },
        update: {
          name, dci, dosage, form, laboratory, category,
          conditionnement: presentation,
          paysOrigine: row.PaysLabo || '',
          shp: shpValue
        },
        create: {
          codeCIP, name, dci, dosage, form, laboratory, category,
          conditionnement: presentation,
          paysOrigine: row.PaysLabo || '',
          shp: shpValue
        }
      });
    }).filter(p => p !== null);

    try {
      await Promise.all(operations);
      count += operations.length;
    } catch (err) {
      console.error(`Error in batch starting at ${i}:`, err.message);
    }

    if (count % 1000 === 0 || i + batchSize >= rows.length) {
      console.log(`✅ ${count} médicaments traités...`);
    }
  }

  console.log("🏁 Importation terminée avec succès !");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
