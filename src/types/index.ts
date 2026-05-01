import { Role, OrderStatus, WholesalerOrderStatus, NotificationType } from "@prisma/client";

export type { Role, OrderStatus, WholesalerOrderStatus, NotificationType };

// ─── Auth ──────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isVerified: boolean;
  pharmacyId?: string | null;
  patientId?: string | null;
  wholesalerId?: string | null;
}

// ─── API Response ──────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Stock ─────────────────────────────────────────────────
export interface StockWithMedicine {
  id: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  expirationDate: string;
  batchNumber?: string | null;
  isVisible: boolean;
  isLowStock: boolean;
  isExpiringSoon: boolean;
  medicine: {
    id: string;
    name: string;
    dci: string;
    dosage?: string | null;
    form?: string | null;
    category?: string | null;
    isPrescriptionRequired: boolean;
    isFrigo: boolean;
    codeCIP: string;
  };
}

// ─── Commandes ─────────────────────────────────────────────
export interface OrderWithDetails {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  prescriptionImageUrl?: string | null;
  prescriptionValidatedAt?: string | null;
  pharmacistNote?: string | null;
  createdAt: string;
  patient: {
    fullName: string;
    userId: string;
  };
  pharmacy: {
    name: string;
    address: string;
    city: string;
  };
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    medicine: { name: string; dci: string; dosage?: string | null };
  }[];
}

// ─── Médicaments / Recherche ───────────────────────────────
export interface MedicineSearchResult {
  id: string;
  name: string;
  dci: string;
  dosage?: string | null;
  form?: string | null;
  category?: string | null;
  laboratory?: string | null;
  isPrescriptionRequired: boolean;
  isRemboursable: boolean;
  pharmacies: PharmacyStockResult[];
}

export interface PharmacyStockResult {
  pharmacyId: string;
  pharmacyName: string;
  address: string;
  city: string;
  wilaya: string;
  distance?: number;
  sellingPrice: number;
  quantity: number;
  isLowStock: boolean;
  geoLocation: { lat: number; lng: number };
  openingHours: Record<string, string>;
}

// ─── Notifications ─────────────────────────────────────────
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

// ─── Dashboard Stats ───────────────────────────────────────
export interface PharmacyStats {
  ordersToday: number;
  revenuToday: number;
  pendingOrders: number;
  lowStockCount: number;
  expiredCount: number;
  revenueMonth: number;
  revenuePrevMonth: number;
}

export interface WholesalerStats {
  ordersToday: number;
  revenueMonth: number;
  topProducts: { medicineName: string; quantity: number }[];
}

// ─── Wilayas Algérie ───────────────────────────────────────
export const WILAYAS: { code: string; name: string }[] = [
  { code: "01", name: "Adrar" }, { code: "02", name: "Chlef" },
  { code: "03", name: "Laghouat" }, { code: "04", name: "Oum El Bouaghi" },
  { code: "05", name: "Batna" }, { code: "06", name: "Béjaïa" },
  { code: "07", name: "Biskra" }, { code: "08", name: "Béchar" },
  { code: "09", name: "Blida" }, { code: "10", name: "Bouira" },
  { code: "11", name: "Tamanrasset" }, { code: "12", name: "Tébessa" },
  { code: "13", name: "Tlemcen" }, { code: "14", name: "Tiaret" },
  { code: "15", name: "Tizi Ouzou" }, { code: "16", name: "Alger" },
  { code: "17", name: "Djelfa" }, { code: "18", name: "Jijel" },
  { code: "19", name: "Sétif" }, { code: "20", name: "Saïda" },
  { code: "21", name: "Skikda" }, { code: "22", name: "Sidi Bel Abbès" },
  { code: "23", name: "Annaba" }, { code: "24", name: "Guelma" },
  { code: "25", name: "Constantine" }, { code: "26", name: "Médéa" },
  { code: "27", name: "Mostaganem" }, { code: "28", name: "M'Sila" },
  { code: "29", name: "Mascara" }, { code: "30", name: "Ouargla" },
  { code: "31", name: "Oran" }, { code: "32", name: "El Bayadh" },
  { code: "33", name: "Illizi" }, { code: "34", name: "Bordj Bou Arréridj" },
  { code: "35", name: "Boumerdès" }, { code: "36", name: "El Tarf" },
  { code: "37", name: "Tindouf" }, { code: "38", name: "Tissemsilt" },
  { code: "39", name: "El Oued" }, { code: "40", name: "Khenchela" },
  { code: "41", name: "Souk Ahras" }, { code: "42", name: "Tipaza" },
  { code: "43", name: "Mila" }, { code: "44", name: "Aïn Defla" },
  { code: "45", name: "Naâma" }, { code: "46", name: "Aïn Témouchent" },
  { code: "47", name: "Ghardaïa" }, { code: "48", name: "Relizane" },
  { code: "49", name: "Timimoun" }, { code: "50", name: "Bordj Badji Mokhtar" },
  { code: "51", name: "Ouled Djellal" }, { code: "52", name: "Béni Abbès" },
  { code: "53", name: "In Salah" }, { code: "54", name: "In Guezzam" },
  { code: "55", name: "Touggourt" }, { code: "56", name: "Djanet" },
  { code: "57", name: "El M'Ghair" }, { code: "58", name: "El Meniaa" },
];
