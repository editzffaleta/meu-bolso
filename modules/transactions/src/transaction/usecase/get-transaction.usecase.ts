import { NotFoundError, UseCase } from "@meubolso/shared";
import { Transaction } from "../model";
import { TransactionRepository } from "../provider";

export interface GetTransactionIn {
  id: string;
  userId: string;
}

export class GetTransaction implements UseCase<GetTransactionIn, Transaction> {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(input: GetTransactionIn): Promise<Transaction> {
    const existing = await this.transactionRepository.findById(
      input.id,
      input.userId,
    );

    if (!existing) {
      throw new NotFoundError("transaction.not.found");
    }

    return existing;
  }
}
