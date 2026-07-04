import { roundMoney, UseCase } from "@meubolso/shared";
import { AccountRepository } from "@meubolso/accounts";
import { TransactionRepository } from "@meubolso/transactions";

export interface GetConsolidatedBalanceIn {
  userId: string;
}

export interface ConsolidatedBalanceOut {
  balance: number;
}

/**
 * Calcula o saldo consolidado REAL do usuario: soma do `initialBalance` de
 * todas as contas + total de receitas - total de despesas de TODAS as
 * transacoes (all-time, sem filtro de periodo). Introduzido na auditoria
 * M10 para corrigir o "Saldo consolidado" do frontend, que ate entao
 * ignorava as transacoes e somava apenas o saldo inicial das contas.
 */
export class GetConsolidatedBalance
  implements UseCase<GetConsolidatedBalanceIn, ConsolidatedBalanceOut>
{
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(
    input: GetConsolidatedBalanceIn,
  ): Promise<ConsolidatedBalanceOut> {
    const [initialBalanceTotal, summary] = await Promise.all([
      this.accountRepository.sumInitialBalance(input.userId),
      this.transactionRepository.sumAllTime(input.userId),
    ]);

    const balance = roundMoney(
      initialBalanceTotal + summary.income - summary.expense,
    );

    return { balance };
  }
}
