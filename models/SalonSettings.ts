import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOpeningHour {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
}

export interface IGoogleReviewsSettings {
  enabled: boolean;
  placeId: string;
  businessUrl: string;
  maxReviews: number;
}

export interface IExternalSystemSettings {
  loginUrl: string;
  registerUrl: string;
  bookingUrl: string;
}

export interface IPageVisibilitySettings {
  products: boolean;
  promotions: boolean;
  wedding: boolean;
  vendors: boolean;
  gallery: boolean;
}

export function normalizePageVisibility(
  raw?: Partial<IPageVisibilitySettings> | null
): IPageVisibilitySettings {
  return {
    products: raw?.products !== undefined ? Boolean(raw.products) : true,
    promotions: raw?.promotions !== undefined ? Boolean(raw.promotions) : true,
    wedding: raw?.wedding !== undefined ? Boolean(raw.wedding) : true,
    vendors: raw?.vendors !== undefined ? Boolean(raw.vendors) : true,
    gallery: raw?.gallery !== undefined ? Boolean(raw.gallery) : true,
  };
}

export interface IProductFeatureSectionsSettings {
  mostPopular: boolean;
  fastMoving: boolean;
  discounts: boolean;
}

export function normalizeProductFeatureSections(
  raw?: Partial<IProductFeatureSectionsSettings> | null
): IProductFeatureSectionsSettings {
  return {
    mostPopular: raw?.mostPopular !== undefined ? Boolean(raw.mostPopular) : true,
    fastMoving: raw?.fastMoving !== undefined ? Boolean(raw.fastMoving) : true,
    discounts: raw?.discounts !== undefined ? Boolean(raw.discounts) : true,
  };
}

export interface ISalonBranch {
  _id?: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  mapUrl?: string;
  isMain?: boolean;
}

export interface ISalonSettings extends Document {
  salonName: string;
  logo: string;
  logoPublicId?: string;
  footerLogo?: string;
  footerLogoPublicId?: string;
  aboutDescription: string;
  phone: string;
  phoneSecondary: string;
  whatsapp: string;
  email: string;
  address: string;
  branches?: ISalonBranch[];
  openingHours: IOpeningHour[];
  socialMedia: {
    facebook: string;
    instagram: string;
    tiktok: string;
    whatsapp: string;
  };
  googleReviews?: IGoogleReviewsSettings;
  externalSystem?: IExternalSystemSettings;
  pageVisibility?: IPageVisibilitySettings;
  productFeatureSections?: IProductFeatureSectionsSettings;
  createdAt: Date;
  updatedAt: Date;
}

const defaultOpeningHours: IOpeningHour[] = [
  { day: "Monday", open: "09:00", close: "19:00", isClosed: false },
  { day: "Tuesday", open: "09:00", close: "19:00", isClosed: false },
  { day: "Wednesday", open: "09:00", close: "19:00", isClosed: false },
  { day: "Thursday", open: "09:00", close: "19:00", isClosed: false },
  { day: "Friday", open: "09:00", close: "19:00", isClosed: false },
  { day: "Saturday", open: "09:00", close: "19:00", isClosed: false },
  { day: "Sunday", open: "10:00", close: "17:00", isClosed: false },
];

const SalonSettingsSchema = new Schema<ISalonSettings>(
  {
    salonName: {
      type: String,
      default: "LUMINA Luxury Salon",
      trim: true,
    },
    logo: {
      type: String,
      default: "",
      trim: true,
    },
    logoPublicId: {
      type: String,
      default: "",
      trim: true,
    },
    footerLogo: {
      type: String,
      default: "",
      trim: true,
    },
    footerLogoPublicId: {
      type: String,
      default: "",
      trim: true,
    },
    aboutDescription: {
      type: String,
      default:
        "Colombo's premier sanctuary for bespoke hair styling, aesthetic skin therapy, and luxury bridal services.",
      trim: true,
    },
    phone: {
      type: String,
      default: "+94 11 234 5678",
      trim: true,
    },
    phoneSecondary: {
      type: String,
      default: "+94 77 123 4567",
      trim: true,
    },
    whatsapp: {
      type: String,
      default: "+94 77 123 4567",
      trim: true,
    },
    email: {
      type: String,
      default: "concierge@luminasalon.lk",
      trim: true,
    },
    address: {
      type: String,
      default: "42 Horton Place, Cinnamon Gardens, Colombo 07, Sri Lanka",
      trim: true,
    },
    branches: {
      type: [
        {
          name: { type: String, required: true, trim: true },
          address: { type: String, required: true, trim: true },
          phone: { type: String, required: true, trim: true },
          email: { type: String, default: "", trim: true },
          mapUrl: { type: String, default: "", trim: true },
          isMain: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    openingHours: {
      type: [
        {
          day: { type: String, required: true },
          open: { type: String, default: "09:00" },
          close: { type: String, default: "19:00" },
          isClosed: { type: Boolean, default: false },
        },
      ],
      default: defaultOpeningHours,
    },
    socialMedia: {
      facebook: { type: String, default: "https://facebook.com/luminasalon" },
      instagram: { type: String, default: "https://instagram.com/luminasalon" },
      tiktok: { type: String, default: "https://tiktok.com/@luminasalon" },
      whatsapp: { type: String, default: "https://wa.me/94771234567" },
    },
    googleReviews: {
      enabled: {
        type: Boolean,
        default: false,
      },
      placeId: {
        type: String,
        trim: true,
        default: "",
      },
      businessUrl: {
        type: String,
        trim: true,
        default: "",
      },
      maxReviews: {
        type: Number,
        default: 5,
        min: [1, "Minimum reviews to display is 1"],
        max: [5, "Maximum reviews to display is 5"],
      },
    },
    externalSystem: {
      loginUrl: {
        type: String,
        trim: true,
        default: "",
      },
      registerUrl: {
        type: String,
        trim: true,
        default: "",
      },
      bookingUrl: {
        type: String,
        trim: true,
        default: "",
      },
    },
    pageVisibility: {
      products: {
        type: Boolean,
        default: true,
      },
      promotions: {
        type: Boolean,
        default: true,
      },
      wedding: {
        type: Boolean,
        default: true,
      },
      vendors: {
        type: Boolean,
        default: true,
      },
      gallery: {
        type: Boolean,
        default: true,
      },
    },
    productFeatureSections: {
      mostPopular: {
        type: Boolean,
        default: true,
      },
      fastMoving: {
        type: Boolean,
        default: true,
      },
      discounts: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

if (
  process.env.NODE_ENV !== "production" &&
  mongoose.models &&
  mongoose.models.SalonSettings
) {
  delete mongoose.models.SalonSettings;
}

const SalonSettings: Model<ISalonSettings> =
  mongoose.models.SalonSettings ||
  mongoose.model<ISalonSettings>("SalonSettings", SalonSettingsSchema);

export default SalonSettings;
