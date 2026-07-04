import { CreateRepository, FindByIdRepository } from "@meubolso/shared";
import { User } from "../model";

export interface UserRepository
  extends CreateRepository<User, User>,
    FindByIdRepository<User> {
  findByEmail(email: string): Promise<User | null>;
}
