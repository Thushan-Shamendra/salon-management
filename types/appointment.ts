import { ServiceItem } from "./service";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

export interface AppointmentItem {
  _id: string;
  customer:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        phone: string;
      };
  service: string | ServiceItem;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  appointmentDate: string; // ISO string or YYYY-MM-DD
  startTime: string; // e.g. "09:30"
  endTime: string; // e.g. "10:30"
  duration: number; // minutes
  price: number; // LKR
  note?: string;
  status: AppointmentStatus;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AvailabilitySlotResponse {
  success: boolean;
  message?: string;
  date: string;
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
    image?: string;
  };
  openingHours: {
    open: string;
    close: string;
    isClosed: boolean;
  };
  slots: string[];
}

export interface CreateAppointmentPayload {
  serviceId: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  note?: string;
}

export interface AppointmentActionPayload {
  action?: "status" | "reschedule";
  status?: AppointmentStatus;
  date?: string;
  time?: string;
  reason?: string;
}
