import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAiInsightCache extends Document {
  cacheKey: string;
  range: string;
  result: Record<string, unknown>;
  generatedAt: Date;
  expiresAt: Date;
}

const AiInsightCacheSchema = new Schema<IAiInsightCache>(
  {
    cacheKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    range: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    result: {
      type: Schema.Types.Mixed,
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// TTL index to automatically purge expired cache documents from MongoDB
// Note: TTL index is permitted ONLY for AiInsightCache (never for AnalyticsEvent)
AiInsightCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AiInsightCache: Model<IAiInsightCache> =
  mongoose.models.AiInsightCache ||
  mongoose.model<IAiInsightCache>("AiInsightCache", AiInsightCacheSchema);

export default AiInsightCache;
