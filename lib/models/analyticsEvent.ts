import mongoose, { Document, Schema } from "mongoose";

export interface AnalyticsEvent extends Document {
  visitorId?: string;
  sessionId?: string;
  installationId?: string;
  userId?: string;
  platform: string;
  eventName: string;
  page?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  deviceType?: string;
  userAgent?: string;
  appVersion?: string;
}

const schema = new Schema<AnalyticsEvent>({
  visitorId: { type: String, index: true },
  sessionId: String,
  installationId: String,
  userId: String,
  platform: { type: String, required: true },
  eventName: { type: String, required: true },
  page: String,
  metadata: Schema.Types.Mixed,
  createdAt: { type: Date, required: true, index: true },
  deviceType: String,
  userAgent: String,
  appVersion: String,
}, { collection: "analytics_event", timestamps: false });

schema.index({ platform: 1, eventName: 1, createdAt: -1 });

export default mongoose.models.AnalyticsEvent ||
  mongoose.model<AnalyticsEvent>("AnalyticsEvent", schema, "analytics_event");
