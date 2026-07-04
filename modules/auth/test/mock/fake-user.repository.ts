import { User, UserRepository } from "../../src";

export class FakeUserRepository implements UserRepository {
  private readonly storage = new Map<string, User>();

  constructor(initialUsers: User[] = []) {
    for (const user of initialUsers) {
      this.storage.set(user.id, user);
    }
  }

  get users(): User[] {
    return Array.from(this.storage.values());
  }

  async create(data: User): Promise<User> {
    this.storage.set(data.id, data);
    return data;
  }

  async findById(id: string): Promise<User | null> {
    return this.storage.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }
}
