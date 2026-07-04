import { UseCase } from "@meubolso/shared";
import { Category } from "../model";
import { CategoryRepository } from "../provider";

export interface ListCategoriesIn {
  userId: string;
}

export class ListCategories implements UseCase<ListCategoriesIn, Category[]> {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: ListCategoriesIn): Promise<Category[]> {
    return this.categoryRepository.findAll(input.userId);
  }
}
