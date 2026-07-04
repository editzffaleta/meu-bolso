import { UseCase } from "@meubolso/shared";
import { Category, CategoryType } from "../model";
import { CategoryRepository } from "../provider";

export interface CreateCategoryIn {
  name: string;
  type: CategoryType;
  color: string;
  icon?: string;
  userId: string;
}

export class CreateCategory implements UseCase<CreateCategoryIn, Category> {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: CreateCategoryIn): Promise<Category> {
    const category = new Category({
      name: input.name,
      type: input.type,
      color: input.color,
      icon: input.icon,
      userId: input.userId,
      isDefault: false,
    });

    category.validate();

    return this.categoryRepository.create(category);
  }
}
