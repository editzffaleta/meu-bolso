import { NotFoundError, UseCase } from "@meubolso/shared";
import { CategoryRepository } from "../provider";

export interface DeleteCategoryIn {
  id: string;
  userId: string;
}

export class DeleteCategory implements UseCase<DeleteCategoryIn, void> {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: DeleteCategoryIn): Promise<void> {
    const existing = await this.categoryRepository.findById(
      input.id,
      input.userId,
    );

    if (!existing) {
      throw new NotFoundError("category.not.found");
    }

    await this.categoryRepository.delete(input.id, input.userId);
  }
}
