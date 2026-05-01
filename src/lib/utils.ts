import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string | null | undefined): string {
  if (amount == null) return "—";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-DZ", {
    timeZone: "Africa/Algiers",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-DZ", {
    timeZone: "Africa/Algiers",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function daysUntilExpiry(date: string | Date): number {
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "status-pending",
    CONFIRMED: "status-confirmed",
    PREPARING: "status-preparing",
    READY: "status-ready",
    DELIVERED: "status-delivered",
    CANCELLED: "status-cancelled",
    REFUSED: "status-refused",
    DRAFT: "status-draft",
    SENT: "status-sent",
    SHIPPED: "status-shipped",
  };
  return colors[status] ?? "status-default";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "En attente",
    CONFIRMED: "Confirmée",
    PREPARING: "En préparation",
    READY: "Prête",
    DELIVERED: "Livrée",
    CANCELLED: "Annulée",
    REFUSED: "Refusée",
    DRAFT: "Brouillon",
    SENT: "Envoyée",
    CONFIRMED_W: "Confirmée",
    SHIPPED: "Expédiée",
  };
  return labels[status] ?? status;
}

export function isPharmacyOpen(openingHours: Record<string, string>): boolean {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Algiers" }));
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayKey = days[now.getDay()];
  const hours = openingHours[dayKey];
  if (!hours || hours === "fermé" || hours === "closed") return false;
  const [open, close] = hours.split("-");
  if (!open || !close) return false;
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = oh * 60 + om;
  const closeMinutes = ch * 60 + cm;
  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}
