import mongoose, { Document, Schema } from "mongoose";

export interface ApplicationError extends Document {
  message: string;
  type: string;
  source: string;
  severity: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  role?: string;
  page?: string;
  endpoint?: string;
  httpStatus?: number;
  stackTrace?: string;
  metadata?: Record<string, unknown>;
  appVersion?: string;
  deviceType?: string;
  userAgent?: string;
  createdAt: Date;
}

const schema = new Schema<ApplicationError>({
  message: { type: String, required: true },
  type: { type: String, required: true },
  source: { type: String, required: true, index: true },
  severity: { type: String, required: true, index: true },
  userId: { type: String, index: true },
  userEmail: String,
  userName: String,
  role: String,
  page: String,
  endpoint: String,
  httpStatus: Number,
  stackTrace: String,
  metadata: Schema.Types.Mixed,
  appVersion: String,
  deviceType: String,
  userAgent: String,
  createdAt: { type: Date, required: true, index: true },
}, { collection: "application_error", timestamps: false });

schema.index({ source: 1, createdAt: -1 });
schema.index({ severity: 1, createdAt: -1 });

export default mongoose.models.ApplicationError ||
  mongoose.model<ApplicationError>("ApplicationError", schema, "application_error");
