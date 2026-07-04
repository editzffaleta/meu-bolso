import { UseCase } from "@meubolso/shared";
import { CategoryRepository } from "@meubolso/categories";
import { TransactionRepository } from "@meubolso/transactions";
import { currentMonth, monthRange } from "../model";

export interface GetSpendingByCategoryIn {
  userId: string;
  month?: string;
}

export interface SpendingByCategoryOut {
  categoryId: string | null;
  name: string;
  color: string;
  total: number;
}

const UNCATEGORIZED_LABEL = "Sem categoria";
const UNCATEGORIZED_COLOR = "#9CA3AF";

export class GetSpendingByCategory
  implements UseCase<GetSpendingByCategoryIn, SpendingByCategoryOut[]>
{
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(
    input: GetSpendingByCategoryIn,
  ): Promise<SpendingByCategoryOut[]> {
    const month = input.month ?? currentMonth();
    const { from, to } = monthRange(month);

    const spending = await this.transactionRepository.sumByCategory(
      input.userId,
      from,
      to,
    );

    const categories = await this.categoryRepository.findAll(input.userId);
    const categoriesById = new Map(
      categories.map((category) => [category.id, category]),
    );

    const result: SpendingByCategoryOut[] = spending.map((item) => {
      if (item.categoryId === null) {
        return {
          categoryId: null,
          name: UNCATEGORIZED_LABEL,
          color: UNCATEGORIZED_COLOR,
          total: item.total,
        };
      }

      const category = categoriesById.get(item.categoryId);

      return {
        categoryId: item.categoryId,
        name: category?.name ?? UNCATEGORIZED_LABEL,
        color: category?.color ?? UNCATEGORIZED_COLOR,
        total: item.total,
      };
    });

    return result.sort((a, b) => b.total - a.total);
  }
}
