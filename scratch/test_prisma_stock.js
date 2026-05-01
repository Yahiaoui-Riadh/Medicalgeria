const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const pharmacy = await prisma.pharmacy.findFirst();
    const medicine = await prisma.medicine.findFirst();
    
    if (!pharmacy || !medicine) {
      console.log("❌ Pharmacie ou Médicament manquant");
      return;
    }

    console.log(`🧪 Test création stock pour ${pharmacy.name} et ${medicine.name}`);

    const stock = await prisma.stock.create({
      data: {
        pharmacyId: pharmacy.id,
        medicineId: medicine.id,
        quantity: 10,
        purchasePrice: 200,
        sellingPrice: 250,
        expirationDate: new Date('2040-12-11'),
        batchNumber: 'test-batch-' + Date.now(),
        isVisible: true,
        isLowStock: true,
        isExpiringSoon: false
      }
    });

    console.log("✅ Stock créé avec succès:", stock.id);
    
    // Cleanup
    await prisma.stock.delete({ where: { id: stock.id } });
    console.log("🗑️ Test stock supprimé.");

  } catch (err) {
    console.error("🔥 Erreur lors du test Prisma:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
