import { NotFoundError, UseCase } from "@meubolso/shared";
import { Category, CategoryType } from "../model";
import { CategoryRepository } from "../provider";

export interface UpdateCategoryIn {
  id: string;
  userId: string;
  name?: string;
  type?: CategoryType;
  color?: string;
  icon?: string;
}

export class UpdateCategory implements UseCase<UpdateCategoryIn, Category> {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: UpdateCategoryIn): Promise<Category> {
    const existing = await this.categoryRepository.findById(
      input.id,
      input.userId,
    );

    if (!existing) {
      throw new NotFoundError("category.not.found");
    }

    const updated = existing.clone({
      name: input.name ?? existing.name,
      type: input.type ?? existing.type,
      color: input.color ?? existing.color,
      icon: input.icon ?? existing.icon,
    });

    updated.validate();

    return this.categoryRepository.update(updated);
  }
}
