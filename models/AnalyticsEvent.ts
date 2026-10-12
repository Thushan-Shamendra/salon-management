import mongoose, { Schema, Document, Model } from "mongoose";
import {
  ANALYTICS_EVENT_TYPES,
  AnalyticsEventType,
  AnalyticsEventMetadata,
} from "@/lib/analytics-constants";

export { ANALYTICS_EVENT_TYPES, type AnalyticsEventType, type AnalyticsEventMetadata };

export interface IAnalyticsEvent extends Document {
  eventType: AnalyticsEventType;
  page?: string;
  branchId?: mongoose.Types.ObjectId;
  entityType?: string;
  entityId?: mongoose.Types.ObjectId;
  metadata?: AnalyticsEventMetadata;
  createdAt: Date;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    eventType: {
      type: String,
      required: [true, "Event type is required"],
      enum: {
        values: ANALYTICS_EVENT_TYPES,
        message: "{VALUE} is not a valid event type",
      },
      index: true,
    },
    page: {
      type: String,
      trim: true,
      maxlength: 200,
      index: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    entityType: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    metadata: {
      label: {
        type: String,
        trim: true,
        maxlength: 200,
      },
      source: {
        type: String,
        trim: true,
        maxlength: 100,
      },
      category: {
        type: String,
        trim: true,
        maxlength: 100,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound indexes for optimal aggregation performance
AnalyticsEventSchema.index({ createdAt: -1 });
AnalyticsEventSchema.index({ eventType: 1, createdAt: -1 });
AnalyticsEventSchema.index({ branchId: 1, createdAt: -1 });
AnalyticsEventSchema.index({ page: 1, createdAt: -1 });

const AnalyticsEvent: Model<IAnalyticsEvent> =
  mongoose.models.AnalyticsEvent ||
  mongoose.model<IAnalyticsEvent>("AnalyticsEvent", AnalyticsEventSchema);

export default AnalyticsEvent;
