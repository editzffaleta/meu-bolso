import { UseCase } from "@meubolso/shared";
import { Category, CategoryType } from "../model";
import { CategoryRepository } from "../provider";

export interface SeedDefaultCategoriesIn {
  userId: string;
}

export interface SeedDefaultCategoriesOut {
  created: number;
  categories: Category[];
}

interface DefaultCategoryDefinition {
  name: string;
  type: CategoryType;
  color: string;
}

const DEFAULT_CATEGORIES: DefaultCategoryDefinition[] = [
  { name: "Mercado", type: "expense", color: "#059669" },
  { name: "Transporte", type: "expense", color: "#0EA5E9" },
  { name: "Moradia", type: "expense", color: "#F59E0B" },
  { name: "Lazer", type: "expense", color: "#A855F7" },
  { name: "Saúde", type: "expense", color: "#EF4444" },
  { name: "Salário", type: "income", color: "#10B981" },
  { name: "Outros", type: "expense", color: "#6B7280" },
];

export class SeedDefaultCategories
  implements UseCase<SeedDefaultCategoriesIn, SeedDefaultCategoriesOut>
{
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(
    input: SeedDefaultCategoriesIn,
  ): Promise<SeedDefaultCategoriesOut> {
    const defaultNames = DEFAULT_CATEGORIES.map((item) => item.name);
    const existing = await this.categoryRepository.findByNames(
      defaultNames,
      input.userId,
    );

    const existingNames = new Set(
      existing.map((category) => category.name.toLowerCase()),
    );

    const missing = DEFAULT_CATEGORIES.filter(
      (definition) => !existingNames.has(definition.name.toLowerCase()),
    );

    const created: Category[] = [];

    for (const definition of missing) {
      const category = new Category({
        name: definition.name,
        type: definition.type,
        color: definition.color,
        userId: input.userId,
        isDefault: true,
      });

      category.validate();

      created.push(await this.categoryRepository.create(category));
    }

    return {
      created: created.length,
      categories: [...existing, ...created],
    };
  }
}
