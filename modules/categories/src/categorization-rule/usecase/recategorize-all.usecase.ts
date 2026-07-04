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

/**
 * Recategoriza em massa as transacoes do usuario.
 *
 * Correcao da auditoria M7: a versao anterior, com
 * `includeAlreadyCategorized=true`, ZERAVA a categoria de TODAS as
 * transacoes uma a uma (sem transacao de banco) antes de reaplicar as
 * regras -- uma falha no meio deixava categorias apagadas, e transacoes que
 * nao casassem com nenhuma regra perdiam a categorizacao manual para
 * sempre.
 *
 * Agora: para cada transacao candidata, calculamos a nova categoria pelas
 * regras SEM zerar antes. So entram no lote de escrita as transacoes que
 * efetivamente casarem com alguma regra (as demais permanecem como estao,
 * preservando categorizacao manual). O lote e persistido atomicamente via
 * `TransactionCategorizationPort.updateMany` (tudo ou nada).
 */
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

    const rules = await this.categorizationRuleRepository.findAllByUser(
      input.userId,
    );
    const candidates = await this.transactionCategorizationPort.findAllByUser(
      input.userId,
    );

    const updates = [];

    for (const transaction of candidates) {
      const matchingRule = rules.find((rule) =>
        rule.matches(transaction.description),
      );

      if (!matchingRule || matchingRule.categoryId === transaction.categoryId) {
        continue;
      }

      const updated = transaction.clone({ categoryId: matchingRule.categoryId });
      updated.validate();

      updates.push(updated);
    }

    if (updates.length > 0) {
      await this.transactionCategorizationPort.updateMany(updates);
    }

    return {
      evaluated: candidates.length,
      categorized: updates.length,
    };
  }
}
