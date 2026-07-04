import { NotFoundError, UseCase } from "@meubolso/shared";
import { AccountRepository } from "@meubolso/accounts";
import { CategoryRepository } from "@meubolso/categories";
import { generateFingerprint, Transaction, TransactionType } from "../model";
import { TransactionRepository } from "../provider";

export interface UpdateTransactionIn {
  id: string;
  userId: string;
  date?: Date;
  description?: string;
  type?: TransactionType;
  amount?: number;
  accountId?: string;
  categoryId?: string | null;
}

export class UpdateTransaction
  implements UseCase<UpdateTransactionIn, Transaction>
{
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly accountRepository: AccountRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(input: UpdateTransactionIn): Promise<Transaction> {
    const existing = await this.transactionRepository.findById(
      input.id,
      input.userId,
    );

    if (!existing) {
      throw new NotFoundError("transaction.not.found");
    }

    const accountId = input.accountId ?? existing.accountId;
    const categoryId =
      input.categoryId !== undefined ? input.categoryId : existing.categoryId;

    const account = await this.accountRepository.findById(
      accountId,
      input.userId,
    );

    if (!account) {
      throw new NotFoundError("transaction.account.not.found");
    }

    if (categoryId) {
      const category = await this.categoryRepository.findById(
        categoryId,
        input.userId,
      );

      if (!category) {
        throw new NotFoundError("transaction.category.not.found");
      }
    }

    const date = input.date ?? existing.date;
    const description = input.description ?? existing.description;
    const type = input.type ?? existing.type;
    const amount = input.amount ?? existing.amount;

    const fingerprint =
      existing.source === "manual"
        ? generateFingerprint({
            userId: input.userId,
            accountId,
            date,
            amount,
            type,
            description,
          })
        : existing.fingerprint;

    const updated = existing.clone({
      date,
      description,
      type,
      amount,
      accountId,
      categoryId,
      fingerprint,
    });

    updated.validate();

    return this.transactionRepository.update(updated);
  }
}
