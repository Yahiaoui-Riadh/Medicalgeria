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
  console.log("🚀 Début de l'importation massive (V3 - Final)...");
  const filePath = 'F:\\Pharm@lgeria\\medicament.xlsx';
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log(`📊 ${rows.length} lignes trouvées.`);

  let count = 0;
  const batchSize = 200;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    
    const operations = batch.map(row => {
      const codeCIP = String(row.Code || row.CodeCIP || '').trim();
      if (!codeCIP || codeCIP === 'NULL') return null;

      const name = row.Designation || row.LibelleProduit || row.Marque || 'Inconnu';
      const dci = row.NomDCI || row.DCI || 'N/A';
      const dosage = String(row.Dosage || '');
      const laboratory = row.NomLabo || '';
      const category = row.Classe || row.Categorie || '';
      const presentation = row.Presentation || row.LibellePresentation || '';
      const shpValue = row.SHP;
      const parsedSHP = shpValue && shpValue !== 'NULL' ? parseFloat(shpValue) : null;
      
      const isRemb = row.bRembourssable === 1 || row.bRembourssable === true || row.bRembourssable === '1';
      const isPrinceps = row.bPrinceps === 1 || row.bPrinceps === true;
      const isFrigo = row.bfrigo === 1 || row.bfrigo === true;

      return prisma.medicine.upsert({
        where: { codeCIP },
        update: {
          name, dci, dosage, 
          form: row.LibellePresentation || '',
          laboratory, category,
          conditionnement: presentation,
          paysOrigine: row.PaysLabo || '',
          shp: parsedSHP,
          isRemboursable: isRemb,
          isPrinceps: isPrinceps,
          isFrigo: isFrigo
        },
        create: {
          codeCIP, name, dci, dosage, 
          form: row.LibellePresentation || '',
          laboratory, category,
          conditionnement: presentation,
          paysOrigine: row.PaysLabo || '',
          shp: parsedSHP,
          isRemboursable: isRemb,
          isPrinceps: isPrinceps,
          isFrigo: isFrigo
        }
      }).catch(() => null);
    }).filter(p => p !== null);

    if (operations.length > 0) {
      await Promise.all(operations);
      count += operations.length;
    }

    if (count > 0 && (count % 2000 === 0 || i + batchSize >= rows.length)) {
      console.log(`✅ ${count} médicaments importés...`);
    }
  }

  console.log(`🏁 Terminé ! Total importé: ${count}`);
}

main().catch(e => console.error(e)).finally(async () => { await prisma.$disconnect(); await pool.end(); });
