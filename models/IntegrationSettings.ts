import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICloudinarySettings {
  cloudName?: string;
  apiKey?: string;
  encryptedApiSecret?: string;
}

export interface IGooglePlacesSettings {
  encryptedApiKey?: string;
}

export interface IAiSettings {
  provider?: string;
  encryptedApiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface IIntegrationSettings extends Document {
  cloudinary?: ICloudinarySettings;
  googlePlaces?: IGooglePlacesSettings;
  ai?: IAiSettings;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CloudinarySettingsSchema = new Schema<ICloudinarySettings>(
  {
    cloudName: { type: String, trim: true },
    apiKey: { type: String, trim: true },
    encryptedApiSecret: { type: String, trim: true },
  },
  { _id: false }
);

const GooglePlacesSettingsSchema = new Schema<IGooglePlacesSettings>(
  {
    encryptedApiKey: { type: String, trim: true },
  },
  { _id: false }
);

const AiSettingsSchema = new Schema<IAiSettings>(
  {
    provider: { type: String, trim: true, default: "openai" },
    encryptedApiKey: { type: String, trim: true },
    model: { type: String, trim: true, default: "gpt-4o-mini" },
    baseUrl: { type: String, trim: true },
  },
  { _id: false }
);

const IntegrationSettingsSchema = new Schema<IIntegrationSettings>(
  {
    cloudinary: { type: CloudinarySettingsSchema, default: () => ({}) },
    googlePlaces: { type: GooglePlacesSettingsSchema, default: () => ({}) },
    ai: { type: AiSettingsSchema, default: () => ({}) },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

const IntegrationSettings: Model<IIntegrationSettings> =
  mongoose.models.IntegrationSettings ||
  mongoose.model<IIntegrationSettings>("IntegrationSettings", IntegrationSettingsSchema);

export default IntegrationSettings;
