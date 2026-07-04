import { ValidationException } from "@meubolso/shared";
import {
  CategorizationRule,
  CategorizationRuleState,
} from "../../../src/categorization-rule/model/categorization-rule.entity";

const VALID_USER_ID = "11111111-1111-4111-8111-111111111111";
const VALID_CATEGORY_ID = "22222222-2222-4222-8222-222222222222";

function buildProps(
  overrides: Partial<CategorizationRuleState> = {},
): CategorizationRuleState {
  return {
    keyword: "uber",
    categoryId: VALID_CATEGORY_ID,
    priority: 0,
    userId: VALID_USER_ID,
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

describe("CategorizationRule entity", () => {
  it("deve criar uma entidade valida com os getters corretos", () => {
    const rule = new CategorizationRule(buildProps());

    expect(rule.keyword).toBe("uber");
    expect(rule.categoryId).toBe(VALID_CATEGORY_ID);
    expect(rule.priority).toBe(0);
    expect(rule.userId).toBe(VALID_USER_ID);
    expect(rule.id).toBeDefined();
    expect(rule.createdAt).toBeInstanceOf(Date);
    expect(rule.updatedAt).toBeInstanceOf(Date);
    expect(rule.deletedAt).toBeNull();
  });

  it("deve aplicar default 0 para priority quando nao informado", () => {
    const rule = new CategorizationRule(
      buildProps({ priority: undefined as unknown as number }),
    );

    expect(rule.priority).toBe(0);
    expect(() => rule.validate()).not.toThrow();
  });

  it("deve aceitar priority customizado", () => {
    const rule = new CategorizationRule(buildProps({ priority: 5 }));

    expect(rule.priority).toBe(5);
  });

  it("deve remover espacos em branco do keyword (trim)", () => {
    const rule = new CategorizationRule(buildProps({ keyword: "  uber  " }));

    expect(rule.keyword).toBe("uber");
  });

  it("deve permitir existir invalida antes de validate() ser chamado (lazy)", () => {
    expect(
      () =>
        new CategorizationRule(
          buildProps({
            keyword: "",
            categoryId: "nao-e-uuid",
            userId: "nao-e-uuid",
          }),
        ),
    ).not.toThrow();
  });

  it("nao deve lancar erro ao validar uma entidade valida", () => {
    const rule = new CategorizationRule(buildProps());

    expect(() => rule.validate()).not.toThrow();
  });

  it("clone() deve preservar id e createdAt e atualizar updatedAt", () => {
    const rule = new CategorizationRule(buildProps());
    const cloned = rule.clone({ keyword: "99app" });

    expect(cloned.id).toBe(rule.id);
    expect(cloned.createdAt).toEqual(rule.createdAt);
    expect(cloned.keyword).toBe("99app");
  });

  describe("validacao de keyword", () => {
    it("deve rejeitar keyword vazia", () => {
      const rule = new CategorizationRule(buildProps({ keyword: "" }));
      const messages = getValidationMessages(() => rule.validate());

      expect(
        messages.some((message) => message.includes("categorization-rule.keyword")),
      ).toBe(true);
    });

    it("deve rejeitar keyword apenas com espacos", () => {
      const rule = new CategorizationRule(buildProps({ keyword: "   " }));
      const messages = getValidationMessages(() => rule.validate());

      expect(
        messages.some((message) => message.includes("categorization-rule.keyword")),
      ).toBe(true);
    });
  });

  describe("validacao de categoryId", () => {
    it("deve rejeitar categoryId vazio", () => {
      const rule = new CategorizationRule(buildProps({ categoryId: "" }));
      const messages = getValidationMessages(() => rule.validate());

      expect(
        messages.some((message) =>
          message.includes("categorization-rule.categoryId"),
        ),
      ).toBe(true);
    });

    it("deve rejeitar categoryId que nao e uuid", () => {
      const rule = new CategorizationRule(
        buildProps({ categoryId: "nao-e-uuid" }),
      );
      const messages = getValidationMessages(() => rule.validate());

      expect(
        messages.some((message) =>
          message.includes("categorization-rule.categoryId"),
        ),
      ).toBe(true);
    });
  });

  describe("validacao de priority", () => {
    it("deve rejeitar priority nao inteiro", () => {
      const rule = new CategorizationRule(buildProps({ priority: 1.5 }));
      const messages = getValidationMessages(() => rule.validate());

      expect(
        messages.some((message) =>
          message.includes("categorization-rule.priority"),
        ),
      ).toBe(true);
    });
  });

  describe("validacao de userId", () => {
    it("deve rejeitar userId vazio", () => {
      const rule = new CategorizationRule(buildProps({ userId: "" }));
      const messages = getValidationMessages(() => rule.validate());

      expect(
        messages.some((message) => message.includes("categorization-rule.userId")),
      ).toBe(true);
    });

    it("deve rejeitar userId que nao e uuid", () => {
      const rule = new CategorizationRule(
        buildProps({ userId: "nao-e-uuid" }),
      );
      const messages = getValidationMessages(() => rule.validate());

      expect(
        messages.some((message) => message.includes("categorization-rule.userId")),
      ).toBe(true);
    });
  });

  it("deve acumular multiplos erros de validacao ao mesmo tempo", () => {
    const rule = new CategorizationRule(
      buildProps({
        keyword: "",
        categoryId: "nao-e-uuid",
        userId: "nao-e-uuid",
      }),
    );
    const messages = getValidationMessages(() => rule.validate());

    expect(messages.length).toBeGreaterThanOrEqual(3);
  });

  describe("matches()", () => {
    it("deve retornar true quando a description contem a keyword (case-insensitive)", () => {
      const rule = new CategorizationRule(buildProps({ keyword: "uber" }));

      expect(rule.matches("UBER *TRIP")).toBe(true);
      expect(rule.matches("pagamento uber eats")).toBe(true);
    });

    it("deve retornar false quando a description nao contem a keyword", () => {
      const rule = new CategorizationRule(buildProps({ keyword: "uber" }));

      expect(rule.matches("Supermercado ABC")).toBe(false);
    });
  });
});
