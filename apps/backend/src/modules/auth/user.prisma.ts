import { Injectable } from '@nestjs/common';
import { User, UserRepository } from '@meubolso/auth';
import { PrismaService } from '../../db/prisma.service';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: User): Promise<User> {
    const created = await this.prisma.user.create({
      data: this.toPersistence(data),
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<User | null> {
    const found = await this.prisma.user.findUnique({
      where: { id },
    });

    return found ? this.toDomain(found) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const found = await this.prisma.user.findUnique({
      where: { email },
    });

    return found ? this.toDomain(found) : null;
  }

  private toPersistence(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
    };
  }

  private toDomain(raw: {
    id: string;
    name: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }): User {
    return new User({
      id: raw.id,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
      name: raw.name,
      email: raw.email,
      password: raw.password,
    });
  }
}
