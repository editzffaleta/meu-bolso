import { Category, ListCategories } from "../../../src";
import { FakeCategoryRepository } from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";

describe("ListCategories", () => {
  it("deve listar apenas as categorias do usuario informado", async () => {
    const categoryUser1 = new Category({
      name: "Mercado",
      type: "expense",
      color: "#059669",
      userId: USER_ID,
      isDefault: false,
    });
    const categoryUser2 = new Category({
      name: "Transporte",
      type: "expense",
      color: "#0EA5E9",
      userId: OTHER_USER_ID,
      isDefault: false,
    });
    const categoryRepository = new FakeCategoryRepository([
      categoryUser1,
      categoryUser2,
    ]);
    const useCase = new ListCategories(categoryRepository);

    const result = await useCase.execute({ userId: USER_ID });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(categoryUser1.id);
  });

  it("deve retornar lista vazia quando o usuario nao possui categorias", async () => {
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new ListCategories(categoryRepository);

    const result = await useCase.execute({ userId: USER_ID });

    expect(result).toHaveLength(0);
  });
});
