import { ValidationException } from "@meubolso/shared";
import { Category, CategoryState } from "../../../src/category/model/category.entity";

const VALID_USER_ID = "11111111-1111-4111-8111-111111111111";

function buildProps(overrides: Partial<CategoryState> = {}): CategoryState {
  return {
    name: "Mercado",
    type: "expense",
    color: "#059669",
    icon: "shopping-cart",
    userId: VALID_USER_ID,
    isDefault: false,
    ...overrides,
  };
}

function getValidationMessages(callback: () => void): string[] {
  try {
    callback();
    return [];
  } catch (error) {
    return (error as ValidationException).errors.map((item) => item.message);
  }
}

describe("Category entity", () => {
  it("deve criar uma entidade valida com os getters corretos", () => {
    const category = new Category(buildProps());

    expect(category.name).toBe("Mercado");
    expect(category.type).toBe("expense");
    expect(category.color).toBe("#059669");
    expect(category.icon).toBe("shopping-cart");
    expect(category.userId).toBe(VALID_USER_ID);
    expect(category.isDefault).toBe(false);
    expect(category.id).toBeDefined();
    expect(category.createdAt).toBeInstanceOf(Date);
    expect(category.updatedAt).toBeInstanceOf(Date);
    expect(category.deletedAt).toBeNull();
  });

  it("deve aplicar default false para isDefault quando nao informado", () => {
    const category = new Category(
      buildProps({ isDefault: undefined as unknown as boolean }),
    );

    expect(category.isDefault).toBe(false);
    expect(() => category.validate()).not.toThrow();
  });

  it("deve aceitar isDefault true", () => {
    const category = new Category(buildProps({ isDefault: true }));

    expect(category.isDefault).toBe(true);
  });

  it("deve permitir icon opcional (undefined)", () => {
    const category = new Category(buildProps({ icon: undefined }));

    expect(category.icon).toBeUndefined();
    expect(() => category.validate()).not.toThrow();
  });

  it("deve permitir existir invalida antes de validate() ser chamado (lazy)", () => {
    expect(
      () =>
        new Category(
          buildProps({
            name: "",
            type: "invalid" as unknown as CategoryState["type"],
            color: "nao-e-hex",
            userId: "nao-e-uuid",
          }),
        ),
    ).not.toThrow();
  });

  it("nao deve lancar erro ao validar uma entidade valida", () => {
    const category = new Category(buildProps());

    expect(() => category.validate()).not.toThrow();
  });

  it("clone() deve preservar id e createdAt e atualizar updatedAt", () => {
    const category = new Category(buildProps());
    const cloned = category.clone({ name: "Mercado atualizado" });

    expect(cloned.id).toBe(category.id);
    expect(cloned.createdAt).toEqual(category.createdAt);
    expect(cloned.name).toBe("Mercado atualizado");
  });

  describe("validacao de name", () => {
    it("deve rejeitar name vazio", () => {
      const category = new Category(buildProps({ name: "" }));
      const messages = getValidationMessages(() => category.validate());

      expect(messages.some((message) => message.includes("category.name"))).toBe(true);
    });
  });

  describe("validacao de type", () => {
    it("deve rejeitar type vazio", () => {
      const category = new Category(
        buildProps({ type: "" as unknown as CategoryState["type"] }),
      );
      const messages = getValidationMessages(() => category.validate());

      expect(messages.some((message) => message.includes("category.type"))).toBe(true);
    });

    it("deve rejeitar type fora do enum permitido", () => {
      const category = new Category(
        buildProps({ type: "invalid" as unknown as CategoryState["type"] }),
      );
      const messages = getValidationMessages(() => category.validate());

      expect(messages.some((message) => message.includes("category.type"))).toBe(true);
    });

    it.each(["expense", "income"] as const)(
      "deve aceitar type %s",
      (type) => {
        const category = new Category(buildProps({ type }));

        expect(() => category.validate()).not.toThrow();
      },
    );
  });

  describe("validacao de color", () => {
    it("deve rejeitar color vazio", () => {
      const category = new Category(buildProps({ color: "" }));
      const messages = getValidationMessages(() => category.validate());

      expect(messages.some((message) => message.includes("category.color"))).toBe(true);
    });

    it("deve rejeitar color fora do padrao hex (3 digitos)", () => {
      const category = new Category(buildProps({ color: "#059" }));
      const messages = getValidationMessages(() => category.validate());

      expect(messages.some((message) => message.includes("category.color"))).toBe(true);
    });

    it("deve rejeitar color sem o simbolo #", () => {
      const category = new Category(buildProps({ color: "059669" }));
      const messages = getValidationMessages(() => category.validate());

      expect(messages.some((message) => message.includes("category.color"))).toBe(true);
    });

    it("deve aceitar color hex valida de 6 digitos", () => {
      const category = new Category(buildProps({ color: "#A855F7" }));

      expect(() => category.validate()).not.toThrow();
    });
  });

  describe("validacao de userId", () => {
    it("deve rejeitar userId vazio", () => {
      const category = new Category(buildProps({ userId: "" }));
      const messages = getValidationMessages(() => category.validate());

      expect(messages.some((message) => message.includes("category.userId"))).toBe(true);
    });

    it("deve rejeitar userId que nao e uuid", () => {
      const category = new Category(buildProps({ userId: "nao-e-uuid" }));
      const messages = getValidationMessages(() => category.validate());

      expect(messages.some((message) => message.includes("category.userId"))).toBe(true);
    });
  });

  it("deve acumular multiplos erros de validacao ao mesmo tempo", () => {
    const category = new Category(
      buildProps({
        name: "",
        type: "invalid" as unknown as CategoryState["type"],
        color: "nao-e-hex",
        userId: "nao-e-uuid",
      }),
    );
    const messages = getValidationMessages(() => category.validate());

    expect(messages.length).toBeGreaterThanOrEqual(4);
  });
});
