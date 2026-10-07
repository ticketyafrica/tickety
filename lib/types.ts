import type { Currency } from "./currency";
export type EventCategory =
  | "Music"
  | "Comedy"
  | "Tech"
  | "Food & Drink"
  | "Networking"
  | "Arts";

export interface TicketType {
  id: string;
  name: string;
  price: number;
  quantityTotal: number;
  quantitySold: number;
  quantityReserved: number;
}

export interface CustomQuestion {
  id: string;
  label: string;
  type: "text" | "select";
  options?: string[];
  required: boolean;
}

export interface EventItem {
  currency?: Currency;
  id: string;
  slug: string;
  title: string;
  description: string;
  state: string;
  venue: string;

  // ISO date, e.g. "2026-09-12"
  date: string;

  // 24-hour time, e.g. "16:00"
  startTime: string;

  // 24-hour time, e.g. "23:00"
  endTime: string;
  timezone?: string;
  status?: "live" | "pending" | "disabled" | "archived";

  category: EventCategory;

  organiserName: string;
  organiserId?: string;

  ticketTypes: TicketType[];
  customQuestions: CustomQuestion[];

  featured: boolean;
  trending: boolean;

  coverGradient: string;
  coverImageUrl?: string;

  tags?: string[];
  refundPolicy?: string;
  minAge?: number;
}

export type PaymentStatus = "paid" | "pending" | "failed";

export type TicketStatus =
  | "active"
  | "used"
  | "transferred"
  | "cancelled";

export interface Attendee {
  currency?: Currency;
  id: string;
  name: string;
  email: string;
  phone: string;

  ticketType: string;
  ticketId: string;

  amountPaid: number;
  purchaseDate: string;

  paymentStatus: PaymentStatus;

  checkInStatus: boolean;
  checkInTime?: string;

  ticketStatus: TicketStatus;

  answers?: string;
}

export interface Transaction {
  currency?: Currency;
  id: string;
  eventTitle: string;
  organiserName: string;
  amount: number;
  platformFee: number;
  date: string;
  status: PaymentStatus;
}

export interface AdminEventSummary {
  currency?: Currency;
  id: string;
  title: string;
  organiserName: string;
  status:
    | "live"
    | "pending"
    | "disabled"
    | "archived";
  date: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  ticketsSold: number;
  gross: number;
}
