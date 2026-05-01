import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Démarrage du seed...");

  // Cleanup existing data to avoid conflicts
  console.log("🧹 Nettoyage...");
  await prisma.wholesalerCatalog.deleteMany();
  await prisma.stock.deleteMany();

  // 1. Médicaments
  const medicinesData = [
    { codeCIP: "09404B00499", name: "XENID", dci: "DICLOFENAC SODIQUE", dosage: "75MG/3ML", form: "SOLUTION INJECTABLE", laboratory: "BIOGALENIC", category: "ANTI-INFLAMMATOIRES", isPrescriptionRequired: true, shp: 280.50, ppa: 310.00 },
    { codeCIP: "00123A00101", name: "DOLIPRANE", dci: "PARACETAMOL", dosage: "1000MG", form: "COMPRIME", laboratory: "SANOFI", category: "ANTALGIQUES", isPrescriptionRequired: false, shp: 180.00, ppa: 210.00 },
    { codeCIP: "00234B00202", name: "AMOXIL", dci: "AMOXICILLINE", dosage: "500MG", form: "GELULE", laboratory: "GSK", category: "ANTIBIOTIQUES", isPrescriptionRequired: true, shp: 450.00, ppa: 520.00 },
    { codeCIP: "00567C00303", name: "GENTAMICINE", dci: "GENTAMICINE", dosage: "80MG", form: "SOLUTION INJECTABLE", laboratory: "SAIDAL", category: "ANTIBIOTIQUES", isPrescriptionRequired: true, isFrigo: true, shp: 320.00, ppa: 380.00 }
  ];

  for (const m of medicinesData) {
    await prisma.medicine.upsert({ where: { codeCIP: m.codeCIP }, update: {}, create: m });
  }

  const demoHash = "$2b$12$JX3crGyC9GmPVzdfo.5uPeAVWTpVtYQYojHTSbPJYnMYHbB5BtN7K";

  // Comptes
  const patientUser = await prisma.user.upsert({
    where: { email: "patient@demo.dz" },
    update: { password: demoHash },
    create: {
      email: "patient@demo.dz", password: demoHash, role: "PATIENT", phone: "0550000001", isVerified: true,
      patient: { create: { fullName: "Amine Patient", address: "Alger", geoLocation: { lat: 36.77, lng: 3.05 } } }
    }
  });

  const pharmacyUser = await prisma.user.upsert({
    where: { email: "pharma@demo.dz" },
    update: { password: demoHash },
    create: {
      email: "pharma@demo.dz", password: demoHash, role: "PHARMACIST", phone: "0550000002", isVerified: true,
      pharmacy: { create: { name: "Pharmacie El Qods", licenseNumber: "PH-16-001", address: "Hydra", city: "Alger", wilaya: "16", geoLocation: { lat: 36.75, lng: 3.03 }, isOnDuty: true, openingHours: { monday: "08:00-19:00", friday: "fermé" } } }
    },
    include: { pharmacy: true }
  });

  const wholesalerUser = await prisma.user.upsert({
    where: { email: "grossiste@demo.dz" },
    update: { password: demoHash },
    create: {
      email: "grossiste@demo.dz", password: demoHash, role: "WHOLESALER", phone: "0550000003", isVerified: true,
      wholesaler: { create: { companyName: "Central Distribution", rcNumber: "RC-16-001", taxId: "TAX-16-001", address: "Rouiba", wilaya: "16" } }
    },
    include: { wholesaler: true }
  });

  const meds = await prisma.medicine.findMany();
  if (pharmacyUser.pharmacy) {
    for (const med of meds) {
      await prisma.stock.create({
        data: { pharmacyId: pharmacyUser.pharmacy.id, medicineId: med.id, quantity: 50, purchasePrice: new Prisma.Decimal(100), sellingPrice: new Prisma.Decimal(130), expirationDate: new Date(Date.now() + 3000000000), batchNumber: "B1", isVisible: true }
      });
    }
  }

  if (wholesalerUser.wholesaler) {
    for (const med of meds) {
      await prisma.wholesalerCatalog.create({
        data: { wholesalerId: wholesalerUser.wholesaler.id, medicineId: med.id, unitPrice: new Prisma.Decimal(90), minOrderQuantity: 10, isAvailable: true }
      });
    }
  }

  console.log("✅ Seed terminé !");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); await pool.end(); });
