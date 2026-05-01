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
  console.log("🚀 Importation massive V4 (Exact Columns)...");
  const filePath = 'F:\\Pharm@lgeria\\medicament.xlsx';
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  console.log(`📊 ${rows.length} lignes à traiter.`);

  let count = 0;
  const batchSize = 300;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    
    const operations = batch.map(row => {
      const codeCIP = String(row.Code || '').trim();
      if (!codeCIP || codeCIP === 'NULL') return null;

      return prisma.medicine.upsert({
        where: { codeCIP },
        update: {
          name: row.Designation || 'Inconnu',
          designation2: row.Designation2 && row.Designation2 !== 'NULL' ? row.Designation2 : null,
          dci: row.NomDCI || 'N/A',
          dosage: String(row.Dosage || ''),
          form: row.LibellePresentation || row.Presentation || '',
          laboratory: row.NomLabo || '',
          category: row.Classe || '',
          conditionnement: row.Condit || row.Presentation || '',
          paysOrigine: row.PaysLabo || '',
          shp: row.SHP && row.SHP !== 'NULL' ? parseFloat(row.SHP) : null,
          ppa: row.PPA && row.PPA !== 'NULL' ? parseFloat(row.PPA) : null,
          remarque: row.Remarque && row.Remarque !== 'NULL' ? row.Remarque : null,
          isRemboursable: row.bRembourssable == 1 || row.bRembourssable == true,
          isPrinceps: row.bPrinceps == 1 || row.bPrinceps == true,
          isFrigo: row.bfrigo == 1 || row.bfrigo == true,
          isPsychotropic: row.bPsycho == 1 || row.bPsycho == true,
        },
        create: {
          codeCIP,
          name: row.Designation || 'Inconnu',
          designation2: row.Designation2 && row.Designation2 !== 'NULL' ? row.Designation2 : null,
          dci: row.NomDCI || 'N/A',
          dosage: String(row.Dosage || ''),
          form: row.LibellePresentation || row.Presentation || '',
          laboratory: row.NomLabo || '',
          category: row.Classe || '',
          conditionnement: row.Condit || row.Presentation || '',
          paysOrigine: row.PaysLabo || '',
          shp: row.SHP && row.SHP !== 'NULL' ? parseFloat(row.SHP) : null,
          ppa: row.PPA && row.PPA !== 'NULL' ? parseFloat(row.PPA) : null,
          remarque: row.Remarque && row.Remarque !== 'NULL' ? row.Remarque : null,
          isRemboursable: row.bRembourssable == 1 || row.bRembourssable == true,
          isPrinceps: row.bPrinceps == 1 || row.bPrinceps == true,
          isFrigo: row.bfrigo == 1 || row.bfrigo == true,
          isPsychotropic: row.bPsycho == 1 || row.bPsycho == true,
        }
      }).catch(() => null);
    }).filter(p => p !== null);

    await Promise.all(operations);
    count += operations.length;

    if (count > 0 && (count % 3000 === 0 || i + batchSize >= rows.length)) {
      console.log(`✅ ${count} médicaments importés avec détails...`);
    }
  }

  console.log(`🏁 Terminé ! Total importé avec succès: ${count}`);
}

main().catch(e => console.error(e)).finally(async () => { await prisma.$disconnect(); await pool.end(); });
