import { contactRepository } from "../repository/contactRepository";
import { type Contact } from "../models/contact";

export const contactService = {
  list(filter?: Parameters<(typeof contactRepository)["findAll"]>[0]) {
    return contactRepository.findAll(filter);
  },
  get(id: string) {
    return contactRepository.findById(id);
  },
  create(data: Partial<Contact>) {
    return contactRepository.create(data);
  },
  update(id: string, data: Partial<Contact>) {
    return contactRepository.updateById(id, data);
  },
  remove(id: string) {
    return contactRepository.deleteById(id);
  },
};
