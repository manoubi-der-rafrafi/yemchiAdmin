import mongoose from "mongoose";

const MONGODB_URI =
  (process.env.MONGODB_URI as string) ||
  (process.env.MONGODB_URL as string);

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI (or MONGODB_URL) in .env.local");
}

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: process.env.DB_NAME,
    });
    isConnected = true;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};
