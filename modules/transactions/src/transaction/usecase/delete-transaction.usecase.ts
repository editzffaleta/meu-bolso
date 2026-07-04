import { NotFoundError, UseCase } from "@meubolso/shared";
import { TransactionRepository } from "../provider";

export interface DeleteTransactionIn {
  id: string;
  userId: string;
}

export class DeleteTransaction implements UseCase<DeleteTransactionIn, void> {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(input: DeleteTransactionIn): Promise<void> {
    const existing = await this.transactionRepository.findById(
      input.id,
      input.userId,
    );

    if (!existing) {
      throw new NotFoundError("transaction.not.found");
    }

    await this.transactionRepository.delete(input.id, input.userId);
  }
}
