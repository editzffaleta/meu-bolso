import { Category } from "../../../src";
import { SeedDefaultCategories } from "../../../src";
import { FakeCategoryRepository } from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";

describe("SeedDefaultCategories", () => {
  it("deve criar as 7 categorias padrao na primeira execucao", async () => {
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new SeedDefaultCategories(categoryRepository);

    const result = await useCase.execute({ userId: USER_ID });

    expect(result.created).toBe(7);
    expect(result.categories).toHaveLength(7);
    expect(result.categories.every((category) => category.isDefault)).toBe(
      true,
    );
    expect(
      result.categories.every((category) => category.userId === USER_ID),
    ).toBe(true);
  });

  it("deve ser idempotente: chamado uma segunda vez nao duplica e retorna created 0", async () => {
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new SeedDefaultCategories(categoryRepository);

    await useCase.execute({ userId: USER_ID });
    const second = await useCase.execute({ userId: USER_ID });

    expect(second.created).toBe(0);
    expect(second.categories).toHaveLength(7);
    expect(categoryRepository.categories).toHaveLength(7);
  });

  it("deve criar apenas as categorias ausentes quando o usuario ja possui algumas do conjunto padrao", async () => {
    const existing = new Category({
      name: "mercado",
      type: "expense",
      color: "#059669",
      userId: USER_ID,
      isDefault: true,
    });
    const categoryRepository = new FakeCategoryRepository([existing]);
    const useCase = new SeedDefaultCategories(categoryRepository);

    const result = await useCase.execute({ userId: USER_ID });

    expect(result.created).toBe(6);
    expect(result.categories).toHaveLength(7);
    expect(categoryRepository.categories).toHaveLength(7);
  });

  it("deve isolar o seed por usuario: outro usuario tem seu proprio conjunto", async () => {
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new SeedDefaultCategories(categoryRepository);

    await useCase.execute({ userId: USER_ID });
    const otherUserResult = await useCase.execute({ userId: OTHER_USER_ID });

    expect(otherUserResult.created).toBe(7);
    expect(categoryRepository.categories).toHaveLength(14);
  });
});
