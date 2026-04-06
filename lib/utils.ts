import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "EUR"): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
  }).format(value);
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...options,
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export const SPECIES_LABELS: Record<string, string> = {
  DOG: "Cão",
  CAT: "Gato",
  BIRD: "Ave",
  RODENT: "Roedor",
  REPTILE: "Réptil",
  FISH: "Peixe",
  RABBIT: "Coelho",
  EXOTIC: "Exótico",
  OTHER: "Outro",
};

export const SPECIES_EMOJI: Record<string, string> = {
  DOG: "🐶",
  CAT: "🐱",
  BIRD: "🐦",
  RODENT: "🐹",
  REPTILE: "🦎",
  FISH: "🐟",
  RABBIT: "🐰",
  EXOTIC: "🦜",
  OTHER: "🐾",
};

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  PET_SHOP: "Pet Shop",
  GROOMING: "Grooming / Tosquia",
  VET_CLINIC: "Clínica Veterinária",
  PET_HOTEL: "Hotel / Creche",
  PET_SITTER: "Pet Sitter",
  TRAINING: "Adestramento",
  DELIVERY: "Delivery de Rações",
  MULTI: "Negócio Misto",
};

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "Em curso",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Não compareceu",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  OVERDUE: "Em atraso",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};
