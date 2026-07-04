import { NotFoundError, UseCase } from "@meubolso/shared";
import { CategorizationRuleRepository } from "../provider";

export interface DeleteCategorizationRuleIn {
  id: string;
  userId: string;
}

export class DeleteCategorizationRule
  implements UseCase<DeleteCategorizationRuleIn, void>
{
  constructor(
    private readonly categorizationRuleRepository: CategorizationRuleRepository,
  ) {}

  async execute(input: DeleteCategorizationRuleIn): Promise<void> {
    const existing = await this.categorizationRuleRepository.findById(
      input.id,
      input.userId,
    );

    if (!existing) {
      throw new NotFoundError("categorization-rule.not.found");
    }

    await this.categorizationRuleRepository.delete(input.id, input.userId);
  }
}
