import { ValidationException } from "@meubolso/shared";
import { CreateCategory } from "../../../src";
import { FakeCategoryRepository } from "../../mock";

const VALID_USER_ID = "11111111-1111-4111-8111-111111111111";

describe("CreateCategory", () => {
  it("deve criar e persistir a categoria com isDefault false no caminho feliz", async () => {
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new CreateCategory(categoryRepository);

    const category = await useCase.execute({
      name: "Mercado",
      type: "expense",
      color: "#059669",
      userId: VALID_USER_ID,
    });

    expect(category.name).toBe("Mercado");
    expect(category.isDefault).toBe(false);
    expect(category.userId).toBe(VALID_USER_ID);
    expect(categoryRepository.categories).toHaveLength(1);
  });

  it("deve criar a categoria com icon informado", async () => {
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new CreateCategory(categoryRepository);

    const category = await useCase.execute({
      name: "Transporte",
      type: "expense",
      color: "#0EA5E9",
      icon: "car",
      userId: VALID_USER_ID,
    });

    expect(category.icon).toBe("car");
  });

  it("deve rejeitar name vazio com ValidationException, sem persistir", async () => {
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new CreateCategory(categoryRepository);

    await expect(
      useCase.execute({
        name: "",
        type: "expense",
        color: "#059669",
        userId: VALID_USER_ID,
      }),
    ).rejects.toThrow(ValidationException);

    expect(categoryRepository.categories).toHaveLength(0);
  });

  it("deve rejeitar type fora do enum permitido, sem persistir", async () => {
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new CreateCategory(categoryRepository);

    await expect(
      useCase.execute({
        name: "Mercado",
        type: "invalid" as never,
        color: "#059669",
        userId: VALID_USER_ID,
      }),
    ).rejects.toThrow(ValidationException);

    expect(categoryRepository.categories).toHaveLength(0);
  });

  it("deve rejeitar color fora do padrao hex, sem persistir", async () => {
    const categoryRepository = new FakeCategoryRepository();
    const useCase = new CreateCategory(categoryRepository);

    await expect(
      useCase.execute({
        name: "Mercado",
        type: "expense",
        color: "nao-e-hex",
        userId: VALID_USER_ID,
      }),
    ).rejects.toThrow(ValidationException);

    expect(categoryRepository.categories).toHaveLength(0);
  });
});
