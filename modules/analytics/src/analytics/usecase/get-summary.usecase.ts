import { UseCase } from "@meubolso/shared";
import { TransactionRepository } from "@meubolso/transactions";
import { currentMonth, monthRange } from "../model";

export interface GetSummaryIn {
  userId: string;
  month?: string;
}

export interface SummaryOut {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export class GetSummary implements UseCase<GetSummaryIn, SummaryOut> {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(input: GetSummaryIn): Promise<SummaryOut> {
    const month = input.month ?? currentMonth();
    const { from, to } = monthRange(month);

    const summary = await this.transactionRepository.sumByType(
      input.userId,
      from,
      to,
    );

    return {
      totalIncome: summary.income,
      totalExpense: summary.expense,
      balance: summary.income - summary.expense,
      transactionCount: summary.count,
    };
  }
}
