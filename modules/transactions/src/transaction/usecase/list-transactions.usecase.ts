import { UseCase } from "@meubolso/shared";
import { Transaction, TransactionType } from "../model";
import { TransactionRepository } from "../provider";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export interface ListTransactionsIn {
  userId: string;
  from?: Date;
  to?: Date;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
  page?: number;
  pageSize?: number;
}

export interface ListTransactionsOut {
  items: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

export class ListTransactions
  implements UseCase<ListTransactionsIn, ListTransactionsOut>
{
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(input: ListTransactionsIn): Promise<ListTransactionsOut> {
    const page =
      input.page && input.page > 0 ? Math.floor(input.page) : DEFAULT_PAGE;

    const pageSize = clampPageSize(input.pageSize);

    const { items, total } = await this.transactionRepository.findMany(
      {
        from: input.from,
        to: input.to,
        accountId: input.accountId,
        categoryId: input.categoryId,
        type: input.type,
      },
      input.userId,
      page,
      pageSize,
    );

    return { items, total, page, pageSize };
  }
}

function clampPageSize(pageSize?: number): number {
  if (!pageSize || pageSize <= 0) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(Math.floor(pageSize), MAX_PAGE_SIZE);
}
