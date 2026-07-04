import { UseCase } from "@meubolso/shared";
import {
  CategorizationRuleRepository,
  TransactionCategorizationPort,
} from "../provider";

export interface ApplyRulesIn {
  userId: string;
  transactionIds?: string[];
}

export interface ApplyRulesOut {
  evaluated: number;
  categorized: number;
}

export class ApplyRules implements UseCase<ApplyRulesIn, ApplyRulesOut> {
  constructor(
    private readonly categorizationRuleRepository: CategorizationRuleRepository,
    private readonly transactionCategorizationPort: TransactionCategorizationPort,
  ) {}

  async execute(input: ApplyRulesIn): Promise<ApplyRulesOut> {
    const rules = await this.categorizationRuleRepository.findAllByUser(
      input.userId,
    );

    const transactions = input.transactionIds
      ? await this.transactionCategorizationPort.findByIds(
          input.transactionIds,
          input.userId,
        )
      : await this.transactionCategorizationPort.findAllWithoutCategory(
          input.userId,
        );

    const targets = transactions.filter((transaction) => !transaction.categoryId);

    let categorized = 0;

    for (const transaction of targets) {
      const matchingRule = rules.find((rule) => rule.matches(transaction.description));

      if (!matchingRule) {
        continue;
      }

      const updated = transaction.clone({ categoryId: matchingRule.categoryId });
      updated.validate();

      await this.transactionCategorizationPort.update(updated);
      categorized += 1;
    }

    return {
      evaluated: targets.length,
      categorized,
    };
  }
}
