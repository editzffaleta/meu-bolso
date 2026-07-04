import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { AuthController } from './auth.controller';
import { PrismaUserRepository } from './user.prisma';
import { BcryptCryptoProvider } from './bcrypt.crypto';

@Module({
  imports: [DbModule],
  controllers: [AuthController],
  providers: [PrismaUserRepository, BcryptCryptoProvider],
  exports: [PrismaUserRepository, BcryptCryptoProvider],
})
export class AuthModule {}
