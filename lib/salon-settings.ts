import { connectDB } from "@/lib/mongodb";
import SalonSettings from "@/models/SalonSettings";

export const DEFAULT_SALON_SETTINGS = {
  salonName: "LUMINA Luxury Salon", logo: "",
  aboutDescription: "Colombo's premier sanctuary for bespoke hair styling, aesthetic skin therapy, and luxury bridal services.",
  phone: "+94 11 234 5678", phoneSecondary: "+94 77 123 4567", whatsapp: "+94 77 123 4567",
  email: "concierge@luminasalon.lk", address: "42 Horton Place, Cinnamon Gardens, Colombo 07, Sri Lanka",
  openingHours: [
    { day: "Monday", open: "09:00", close: "19:00", isClosed: false }, { day: "Tuesday", open: "09:00", close: "19:00", isClosed: false },
    { day: "Wednesday", open: "09:00", close: "19:00", isClosed: false }, { day: "Thursday", open: "09:00", close: "19:00", isClosed: false },
    { day: "Friday", open: "09:00", close: "19:00", isClosed: false }, { day: "Saturday", open: "09:00", close: "19:00", isClosed: false },
    { day: "Sunday", open: "10:00", close: "17:00", isClosed: false },
  ],
  socialMedia: { facebook: "https://facebook.com/luminasalon", instagram: "https://instagram.com/luminasalon", tiktok: "https://tiktok.com/@luminasalon", whatsapp: "https://wa.me/94771234567" },
};

export async function getSalonSettings() {
  try {
    await connectDB();
    const settings = await SalonSettings.findOne().lean();
    if (!settings) return DEFAULT_SALON_SETTINGS;
    return {
      ...DEFAULT_SALON_SETTINGS, ...settings,
      openingHours: settings.openingHours?.length ? settings.openingHours : DEFAULT_SALON_SETTINGS.openingHours,
      socialMedia: { ...DEFAULT_SALON_SETTINGS.socialMedia, ...settings.socialMedia },
    };
  } catch {
    return DEFAULT_SALON_SETTINGS;
  }
}

export function formatSalonTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return `${hours % 12 || 12}:${String(minutes || 0).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
}
