import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { CategoriesController } from './categories.controller';
import { PrismaCategoryRepository } from './category.prisma';

@Module({
  imports: [DbModule],
  controllers: [CategoriesController],
  providers: [PrismaCategoryRepository],
  exports: [PrismaCategoryRepository],
})
export class CategoriesModule {}
