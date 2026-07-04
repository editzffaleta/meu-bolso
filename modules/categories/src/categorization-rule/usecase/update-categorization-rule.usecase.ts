import { NotFoundError, UseCase } from "@meubolso/shared";
import { CategoryRepository } from "../../category/provider";
import { CategorizationRule } from "../model";
import { CategorizationRuleRepository } from "../provider";

export interface UpdateCategorizationRuleIn {
  id: string;
  userId: string;
  keyword?: string;
  categoryId?: string;
  priority?: number;
}

export class UpdateCategorizationRule
  implements UseCase<UpdateCategorizationRuleIn, CategorizationRule>
{
  constructor(
    private readonly categorizationRuleRepository: CategorizationRuleRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(
    input: UpdateCategorizationRuleIn,
  ): Promise<CategorizationRule> {
    const existing = await this.categorizationRuleRepository.findById(
      input.id,
      input.userId,
    );

    if (!existing) {
      throw new NotFoundError("categorization-rule.not.found");
    }

    if (input.categoryId) {
      const category = await this.categoryRepository.findById(
        input.categoryId,
        input.userId,
      );

      if (!category) {
        throw new NotFoundError("categorization-rule.category.not.found");
      }
    }

    const updated = existing.clone({
      keyword: input.keyword ?? existing.keyword,
      categoryId: input.categoryId ?? existing.categoryId,
      priority: input.priority ?? existing.priority,
    });

    updated.validate();

    return this.categorizationRuleRepository.update(updated);
  }
}
