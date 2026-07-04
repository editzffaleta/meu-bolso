import { NotFoundError, UseCase } from "@meubolso/shared";
import { CategoryRepository } from "../../category/provider";
import { CategorizationRule } from "../model";
import { CategorizationRuleRepository } from "../provider";

export interface CreateCategorizationRuleIn {
  keyword: string;
  categoryId: string;
  priority?: number;
  userId: string;
}

export class CreateCategorizationRule
  implements UseCase<CreateCategorizationRuleIn, CategorizationRule>
{
  constructor(
    private readonly categorizationRuleRepository: CategorizationRuleRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(
    input: CreateCategorizationRuleIn,
  ): Promise<CategorizationRule> {
    const category = await this.categoryRepository.findById(
      input.categoryId,
      input.userId,
    );

    if (!category) {
      throw new NotFoundError("categorization-rule.category.not.found");
    }

    const rule = new CategorizationRule({
      keyword: input.keyword,
      categoryId: input.categoryId,
      priority: input.priority ?? 0,
      userId: input.userId,
    });

    rule.validate();

    return this.categorizationRuleRepository.create(rule);
  }
}
