import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  Category,
  CreateCategory,
  DeleteCategory,
  GetCategory,
  ListCategories,
  SeedDefaultCategories,
  SeedDefaultCategoriesOut,
  UpdateCategory,
  type CategoryType,
} from '@meubolso/categories';
import { CurrentUser } from '../../shared/decorators';
import { PrismaCategoryRepository } from './category.prisma';

interface CreateCategoryBody {
  name: string;
  type: CategoryType;
  color: string;
  icon?: string;
}

interface UpdateCategoryBody {
  name?: string;
  type?: CategoryType;
  color?: string;
  icon?: string;
}

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoryRepository: PrismaCategoryRepository) {}

  @Post()
  @HttpCode(201)
  async create(
    @Body() body: CreateCategoryBody,
    @CurrentUser('id') userId: string,
  ): Promise<Category> {
    const useCase = new CreateCategory(this.categoryRepository);

    return useCase.execute({ ...body, userId });
  }

  @Get()
  async list(@CurrentUser('id') userId: string): Promise<Category[]> {
    const useCase = new ListCategories(this.categoryRepository);

    return useCase.execute({ userId });
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<Category> {
    const useCase = new GetCategory(this.categoryRepository);

    return useCase.execute({ id, userId });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateCategoryBody,
    @CurrentUser('id') userId: string,
  ): Promise<Category> {
    const useCase = new UpdateCategory(this.categoryRepository);

    return useCase.execute({ ...body, id, userId });
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    const useCase = new DeleteCategory(this.categoryRepository);

    await useCase.execute({ id, userId });
  }

  @Post('seed-defaults')
  @HttpCode(200)
  async seedDefaults(
    @CurrentUser('id') userId: string,
  ): Promise<SeedDefaultCategoriesOut> {
    const useCase = new SeedDefaultCategories(this.categoryRepository);

    return useCase.execute({ userId });
  }
}
