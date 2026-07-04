import { NotFoundError, UseCase } from "@meubolso/shared";
import { Category } from "../model";
import { CategoryRepository } from "../provider";

export interface GetCategoryIn {
  id: string;
  userId: string;
}

export class GetCategory implements UseCase<GetCategoryIn, Category> {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: GetCategoryIn): Promise<Category> {
    const existing = await this.categoryRepository.findById(
      input.id,
      input.userId,
    );

    if (!existing) {
      throw new NotFoundError("category.not.found");
    }

    return existing;
  }
}
