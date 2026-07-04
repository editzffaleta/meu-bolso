import { UseCase } from "@meubolso/shared";
import {
  CategorizationRuleRepository,
  TransactionCategorizationPort,
} from "../provider";
import { ApplyRules, ApplyRulesOut } from "./apply-rules.usecase";

export interface RecategorizeAllIn {
  userId: string;
  includeAlreadyCategorized?: boolean;
}

export type RecategorizeAllOut = ApplyRulesOut;

export class RecategorizeAll
  implements UseCase<RecategorizeAllIn, RecategorizeAllOut>
{
  constructor(
    private readonly categorizationRuleRepository: CategorizationRuleRepository,
    private readonly transactionCategorizationPort: TransactionCategorizationPort,
  ) {}

  async execute(input: RecategorizeAllIn): Promise<RecategorizeAllOut> {
    const applyRules = new ApplyRules(
      this.categorizationRuleRepository,
      this.transactionCategorizationPort,
    );

    if (!input.includeAlreadyCategorized) {
      return applyRules.execute({ userId: input.userId });
    }

    const allTransactions = await this.transactionCategorizationPort.findAllByUser(
      input.userId,
    );

    const ids: string[] = [];

    for (const transaction of allTransactions) {
      ids.push(transaction.id);

      if (transaction.categoryId) {
        const cleared = transaction.clone({ categoryId: null });
        cleared.validate();

        await this.transactionCategorizationPort.update(cleared);
      }
    }

    return applyRules.execute({ userId: input.userId, transactionIds: ids });
  }
}
