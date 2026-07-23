import mongoose, { Document, Schema } from "mongoose";

export interface UserConnectionSession extends Document {
  userId: string;
  role?: string;
  appType?: string;
  deviceId?: string;
  platform?: string;
  appVersion?: string;
  connectedAt: Date;
  lastHeartbeatAt: Date;
  disconnectedAt?: Date;
  endReason?: string;
}

const schema = new Schema<UserConnectionSession>({
  userId: { type: String, required: true, index: true },
  role: String,
  appType: String,
  deviceId: String,
  platform: String,
  appVersion: String,
  connectedAt: { type: Date, required: true, index: true },
  lastHeartbeatAt: { type: Date, required: true },
  disconnectedAt: Date,
  endReason: String,
}, { collection: "user_connection_session", timestamps: false });

schema.index({ userId: 1, connectedAt: -1 });

export default mongoose.models.UserConnectionSession ||
  mongoose.model<UserConnectionSession>("UserConnectionSession", schema, "user_connection_session");
