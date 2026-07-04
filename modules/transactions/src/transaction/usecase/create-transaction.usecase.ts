import { NotFoundError, UseCase } from "@meubolso/shared";
import { AccountRepository } from "@meubolso/accounts";
import { CategoryRepository } from "@meubolso/categories";
import { generateFingerprint, Transaction, TransactionType } from "../model";
import { TransactionRepository } from "../provider";

export interface CreateTransactionIn {
  date: Date;
  description: string;
  type: TransactionType;
  amount: number;
  accountId: string;
  categoryId?: string;
  userId: string;
}

export class CreateTransaction
  implements UseCase<CreateTransactionIn, Transaction>
{
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly accountRepository: AccountRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(input: CreateTransactionIn): Promise<Transaction> {
    const account = await this.accountRepository.findById(
      input.accountId,
      input.userId,
    );

    if (!account) {
      throw new NotFoundError("transaction.account.not.found");
    }

    if (input.categoryId) {
      const category = await this.categoryRepository.findById(
        input.categoryId,
        input.userId,
      );

      if (!category) {
        throw new NotFoundError("transaction.category.not.found");
      }
    }

    const fingerprint = generateFingerprint({
      userId: input.userId,
      accountId: input.accountId,
      date: input.date,
      amount: input.amount,
      type: input.type,
      description: input.description,
    });

    const transaction = new Transaction({
      date: input.date,
      description: input.description,
      type: input.type,
      amount: input.amount,
      accountId: input.accountId,
      categoryId: input.categoryId,
      source: "manual",
      fingerprint,
      userId: input.userId,
    });

    transaction.validate();

    return this.transactionRepository.create(transaction);
  }
}
