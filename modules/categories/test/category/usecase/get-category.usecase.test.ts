import { NotFoundError } from "@meubolso/shared";
import { Category, GetCategory } from "../../../src";
import { FakeCategoryRepository } from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";

function buildCategory(): Category {
  return new Category({
    name: "Mercado",
    type: "expense",
    color: "#059669",
    userId: USER_ID,
    isDefault: false,
  });
}

describe("GetCategory", () => {
  it("deve retornar a categoria no caminho feliz", async () => {
    const category = buildCategory();
    const categoryRepository = new FakeCategoryRepository([category]);
    const useCase = new GetCategory(categoryRepository);

    const found = await useCase.execute({ id: category.id, userId: USER_ID });

    expect(found.id).toBe(category.id);
  });

  it("deve lancar NotFoundError quando o id nao existir", async () => {
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new GetCategory(categoryRepository);

    await expect(
      useCase.execute({ id: "nao-existe", userId: USER_ID }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("deve lancar NotFoundError quando a categoria pertencer a outro usuario", async () => {
    const category = buildCategory();
    const categoryRepository = new FakeCategoryRepository([category]);
    const useCase = new GetCategory(categoryRepository);

    await expect(
      useCase.execute({ id: category.id, userId: OTHER_USER_ID }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
