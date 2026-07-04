import { UseCase } from "@meubolso/shared";
import { CategorizationRule } from "../model";
import { CategorizationRuleRepository } from "../provider";

export interface ListCategorizationRulesIn {
  userId: string;
}

export class ListCategorizationRules
  implements UseCase<ListCategorizationRulesIn, CategorizationRule[]>
{
  constructor(
    private readonly categorizationRuleRepository: CategorizationRuleRepository,
  ) {}

  async execute(
    input: ListCategorizationRulesIn,
  ): Promise<CategorizationRule[]> {
    return this.categorizationRuleRepository.findAllByUser(input.userId);
  }
}
