import mongoose, { Schema, Document } from "mongoose";

export interface Contact extends Document {
  nom: string;
  email: string;
  telephone: string;
  message: string;
}

const contactSchema = new Schema<Contact>(
  {
    nom: { type: String, required: true },
    email: { type: String, required: true },
    telephone: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true, collection: "contact" }
);

export default mongoose.models.Contact ||
  mongoose.model<Contact>("Contact", contactSchema);
