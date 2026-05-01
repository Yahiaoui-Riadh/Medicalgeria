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
  console.log("🚀 Début de l'importation massive (V2)...");
  const filePath = 'F:\\Pharm@lgeria\\medicament.xlsx';
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  
  // Get raw data to handle headers manually if needed
  const rows = XLSX.utils.sheet_to_json(sheet);
  if (rows.length === 0) {
    console.error("❌ Aucune donnée trouvée dans le fichier.");
    return;
  }

  console.log(`📊 ${rows.length} lignes trouvées. Exemple de clés:`, Object.keys(rows[0]));

  let count = 0;
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    
    const operations = batch.map(row => {
      // Find keys case-insensitively
      const getVal = (possibleKeys) => {
        for (let k of possibleKeys) {
          if (row[k] !== undefined) return row[k];
          // Try lower case
          const keyLower = k.toLowerCase();
          const actualKey = Object.keys(row).find(ak => ak.toLowerCase() === keyLower);
          if (actualKey) return row[actualKey];
        }
        return null;
      };

      const codeCIP = String(getVal(['CodeCIP', 'CIP', 'Code CIP']) || '').trim();
      if (!codeCIP || codeCIP === 'NULL' || codeCIP === '') return null;

      const name = getVal(['LibelleProduit', 'Désignation', 'Nom', 'Marque']) || 'Inconnu';
      const dci = getVal(['DCI', 'DCI_NOM']) || 'N/A';
      const dosage = String(getVal(['Dosage']) || '');
      const form = getVal(['LibelleForme', 'Forme']) || '';
      const laboratory = getVal(['NomLabo', 'Laboratoire', 'Labo']) || '';
      const category = getVal(['Categorie', 'Classe']) || '';
      const presentation = getVal(['LibellePresentation', 'Presentation']) || '';
      const shpValue = getVal(['SHP']);
      const parsedSHP = shpValue && shpValue !== 'NULL' ? parseFloat(shpValue) : null;

      return prisma.medicine.upsert({
        where: { codeCIP },
        update: {
          name, dci, dosage, form, laboratory, category,
          conditionnement: presentation,
          paysOrigine: getVal(['PaysLabo', 'Pays']) || '',
          shp: parsedSHP
        },
        create: {
          codeCIP, name, dci, dosage, form, laboratory, category,
          conditionnement: presentation,
          paysOrigine: getVal(['PaysLabo', 'Pays']) || '',
          shp: parsedSHP
        }
      });
    }).filter(p => p !== null);

    if (operations.length > 0) {
        try {
          await Promise.all(operations);
          count += operations.length;
        } catch (err) {
          console.error(`Error at index ${i}:`, err.message);
        }
    }

    if (count > 0 && (count % 1000 === 0 || i + batchSize >= rows.length)) {
      console.log(`✅ ${count} médicaments importés...`);
    }
  }

  console.log(`🏁 Terminé ! Total importé: ${count}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
