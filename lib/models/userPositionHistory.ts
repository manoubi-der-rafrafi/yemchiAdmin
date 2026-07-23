import mongoose, { Document, Schema } from "mongoose";

export interface UserPositionHistory extends Document {
  userId: string;
  role?: string;
  appType?: string;
  location: { type: "Point"; coordinates: [number, number] };
  accuracyMeters?: number;
  speedMetersPerSecond?: number;
  headingDegrees?: number;
  altitudeMeters?: number;
  collectedAt: Date;
  receivedAt: Date;
  deviceId?: string;
  commandeId?: string;
}

const schema = new Schema<UserPositionHistory>({
  userId: { type: String, required: true, index: true },
  role: String,
  appType: String,
  location: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true },
  },
  accuracyMeters: Number,
  speedMetersPerSecond: Number,
  headingDegrees: Number,
  altitudeMeters: Number,
  collectedAt: { type: Date, required: true, index: true },
  receivedAt: { type: Date, required: true },
  deviceId: String,
  commandeId: String,
}, { collection: "user_position_history", timestamps: false });

schema.index({ userId: 1, collectedAt: -1 });
schema.index({ location: "2dsphere" });

export default mongoose.models.UserPositionHistory ||
  mongoose.model<UserPositionHistory>("UserPositionHistory", schema, "user_position_history");
