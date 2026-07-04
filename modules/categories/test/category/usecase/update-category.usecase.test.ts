import { NotFoundError, ValidationException } from "@meubolso/shared";
import { Category, CategoryState, UpdateCategory } from "../../../src";
import { FakeCategoryRepository } from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";

function buildCategory(overrides: Partial<CategoryState> = {}): Category {
  return new Category({
    name: "Mercado",
    type: "expense",
    color: "#059669",
    userId: USER_ID,
    isDefault: false,
    ...overrides,
  });
}

describe("UpdateCategory", () => {
  it("deve atualizar os campos informados no caminho feliz", async () => {
    const category = buildCategory();
    const categoryRepository = new FakeCategoryRepository([category]);
    const useCase = new UpdateCategory(categoryRepository);

    const updated = await useCase.execute({
      id: category.id,
      userId: USER_ID,
      name: "Mercado atualizado",
      color: "#A855F7",
    });

    expect(updated.name).toBe("Mercado atualizado");
    expect(updated.color).toBe("#A855F7");
    expect(updated.type).toBe("expense");
  });

  it("deve atualizar o icon quando informado", async () => {
    const category = buildCategory();
    const categoryRepository = new FakeCategoryRepository([category]);
    const useCase = new UpdateCategory(categoryRepository);

    const updated = await useCase.execute({
      id: category.id,
      userId: USER_ID,
      icon: "shopping-bag",
    });

    expect(updated.icon).toBe("shopping-bag");
  });

  it("deve lancar NotFoundError quando o id nao existir", async () => {
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new UpdateCategory(categoryRepository);

    await expect(
      useCase.execute({ id: "nao-existe", userId: USER_ID, name: "X" }),
    ).rejects.toMatchObject({
      message: "category.not.found",
    });
  });

  it("deve lancar NotFoundError quando a categoria existir mas pertencer a outro usuario", async () => {
    const category = buildCategory();
    const categoryRepository = new FakeCategoryRepository([category]);
    const useCase = new UpdateCategory(categoryRepository);

    await expect(
      useCase.execute({ id: category.id, userId: OTHER_USER_ID, name: "X" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("deve rejeitar atualizacao com dados invalidos (name vazio)", async () => {
    const category = buildCategory();
    const categoryRepository = new FakeCategoryRepository([category]);
    const useCase = new UpdateCategory(categoryRepository);

    await expect(
      useCase.execute({ id: category.id, userId: USER_ID, name: "" }),
    ).rejects.toThrow(ValidationException);
  });

  it("deve rejeitar atualizacao com color fora do padrao hex", async () => {
    const category = buildCategory();
    const categoryRepository = new FakeCategoryRepository([category]);
    const useCase = new UpdateCategory(categoryRepository);

    await expect(
      useCase.execute({ id: category.id, userId: USER_ID, color: "invalida" }),
    ).rejects.toThrow(ValidationException);
  });
});
