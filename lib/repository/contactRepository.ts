import { connectDB } from "../config/db";
import ContactModel, { type Contact } from "../models/contact";

export const contactRepository = {
  async findAll(
    filter: Parameters<(typeof ContactModel)["find"]>[0] = {}
  ) {
    await connectDB();
    return ContactModel.find(filter).exec();
  },

  async findById(id: string) {
    await connectDB();
    return ContactModel.findById(id).exec();
  },

  async create(data: Partial<Contact>) {
    await connectDB();
    const contact = new ContactModel(data);
    return contact.save();
  },

  async updateById(id: string, data: Partial<Contact>) {
    await connectDB();
    return ContactModel.findByIdAndUpdate(id, data, { new: true }).exec();
  },

  async deleteById(id: string) {
    await connectDB();
    return ContactModel.findByIdAndDelete(id).exec();
  },
};
