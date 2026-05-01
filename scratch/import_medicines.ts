import * as XLSX from 'xlsx';
import path from 'path';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const filePath = path.join('F:', 'Pharm@lgeria', 'medicament.xlsx');

async function importMedicines() {
  console.log("🚀 Démarrage de l'importation massive (OPTIMISÉE)...");

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📦 ${rawData.length} lignes trouvées dans le fichier.`);

    // Nettoyage avant import massif (optionnel mais recommandé pour la vitesse)
    // console.log("🧹 Nettoyage de la table Medicine...");
    // await prisma.medicine.deleteMany(); 

    const CHUNK_SIZE = 5000;
    let imported = 0;

    for (let i = 0; i < rawData.length; i += CHUNK_SIZE) {
      const chunk = rawData.slice(i, i + CHUNK_SIZE).map(row => {
        const codeCIP = String(row.Code || "").trim();
        return {
          codeCIP,
          name: String(row.Designation2 || row.Designation || "Sans nom"),
          dci: String(row.NomDCI || "Inconnu"),
          dosage: row.Dosage != null ? String(row.Dosage) : "",
          form: String(row.LibellePresentation || row.Presentation || ""),
          laboratory: String(row.NomLabo || ""),
          category: String(row.Classe || ""),
          conditionnement: String(row.Condit || ""),
          paysOrigine: String(row.PaysLabo || ""),
          isPrescriptionRequired: row.bPsycho === 1 || row.bSortieControle === 1,
          isFrigo: row.bfrigo === 1,
          isPrinceps: row.bPrinceps === 1,
          isRemboursable: row.bRembourssable === 1,
          tva: typeof row.TVAPourCent === 'number' ? row.TVAPourCent / 100 : 0.09,
          shp: row.SHP && !isNaN(parseFloat(row.SHP)) ? parseFloat(row.SHP) : null,
        };
      }).filter(m => m.codeCIP);

      await prisma.medicine.createMany({
        data: chunk,
        skipDuplicates: true,
      });

      imported += chunk.length;
      console.log(`✅ ${imported} / ${rawData.length} médicaments traités...`);
    }

    console.log(`✨ Importation terminée avec succès !`);
  } catch (error) {
    console.error("💀 Erreur fatale lors de l'importation:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

importMedicines();
