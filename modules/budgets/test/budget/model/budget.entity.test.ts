import { ValidationException } from "@meubolso/shared";
import { Budget, BudgetState } from "../../../src/budget/model/budget.entity";

const VALID_USER_ID = "11111111-1111-4111-8111-111111111111";
const VALID_CATEGORY_ID = "22222222-2222-4222-8222-222222222222";

function buildProps(overrides: Partial<BudgetState> = {}): BudgetState {
  return {
    categoryId: VALID_CATEGORY_ID,
    month: "2026-07",
    limitAmount: 500,
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

describe("Budget entity", () => {
  it("deve criar uma entidade valida com os getters corretos", () => {
    const budget = new Budget(buildProps());

    expect(budget.categoryId).toBe(VALID_CATEGORY_ID);
    expect(budget.month).toBe("2026-07");
    expect(budget.limitAmount).toBe(500);
    expect(budget.userId).toBe(VALID_USER_ID);
    expect(budget.id).toBeDefined();
    expect(budget.createdAt).toBeInstanceOf(Date);
    expect(budget.updatedAt).toBeInstanceOf(Date);
    expect(budget.deletedAt).toBeNull();
  });

  it("deve permitir existir invalida antes de validate() ser chamado (lazy)", () => {
    expect(
      () =>
        new Budget(
          buildProps({
            categoryId: "nao-e-uuid",
            month: "2026-13",
            limitAmount: -1,
            userId: "nao-e-uuid",
          }),
        ),
    ).not.toThrow();
  });

  it("nao deve lancar erro ao validar uma entidade valida", () => {
    const budget = new Budget(buildProps());

    expect(() => budget.validate()).not.toThrow();
  });

  it("clone() deve preservar id e createdAt e atualizar updatedAt", () => {
    const budget = new Budget(buildProps());
    const cloned = budget.clone({ limitAmount: 900 });

    expect(cloned.id).toBe(budget.id);
    expect(cloned.createdAt).toEqual(budget.createdAt);
    expect(cloned.limitAmount).toBe(900);
  });

  describe("validacao de categoryId", () => {
    it("deve rejeitar categoryId vazio", () => {
      const budget = new Budget(buildProps({ categoryId: "" }));
      const messages = getValidationMessages(() => budget.validate());

      expect(
        messages.some((message) => message.includes("budget.categoryId")),
      ).toBe(true);
    });

    it("deve rejeitar categoryId que nao e uuid", () => {
      const budget = new Budget(buildProps({ categoryId: "nao-e-uuid" }));
      const messages = getValidationMessages(() => budget.validate());

      expect(
        messages.some((message) => message.includes("budget.categoryId")),
      ).toBe(true);
    });
  });

  describe("validacao de month", () => {
    it("deve rejeitar month vazio", () => {
      const budget = new Budget(buildProps({ month: "" }));
      const messages = getValidationMessages(() => budget.validate());

      expect(messages.some((message) => message.includes("budget.month"))).toBe(
        true,
      );
    });

    it.each(["2026-13", "26-07", "2026-7", "2026/07", "abcd-ef"])(
      "deve rejeitar month em formato invalido: %s",
      (month) => {
        const budget = new Budget(buildProps({ month }));
        const messages = getValidationMessages(() => budget.validate());

        expect(
          messages.some((message) => message.includes("budget.month")),
        ).toBe(true);
      },
    );

    it.each(["2026-01", "2026-07", "2026-12"])(
      "deve aceitar month valido: %s",
      (month) => {
        const budget = new Budget(buildProps({ month }));

        expect(() => budget.validate()).not.toThrow();
      },
    );
  });

  describe("validacao de limitAmount", () => {
    it("deve rejeitar limitAmount ausente", () => {
      const budget = new Budget(
        buildProps({ limitAmount: undefined as unknown as number }),
      );
      const messages = getValidationMessages(() => budget.validate());

      expect(
        messages.some((message) => message.includes("budget.limitAmount")),
      ).toBe(true);
    });

    it("deve rejeitar limitAmount igual a zero", () => {
      const budget = new Budget(buildProps({ limitAmount: 0 }));
      const messages = getValidationMessages(() => budget.validate());

      expect(
        messages.some((message) => message.includes("budget.limitAmount")),
      ).toBe(true);
    });

    it("deve rejeitar limitAmount negativo", () => {
      const budget = new Budget(buildProps({ limitAmount: -10 }));
      const messages = getValidationMessages(() => budget.validate());

      expect(
        messages.some((message) => message.includes("budget.limitAmount")),
      ).toBe(true);
    });

    it("deve aceitar limitAmount positivo", () => {
      const budget = new Budget(buildProps({ limitAmount: 0.01 }));

      expect(() => budget.validate()).not.toThrow();
    });
  });

  describe("validacao de userId", () => {
    it("deve rejeitar userId vazio", () => {
      const budget = new Budget(buildProps({ userId: "" }));
      const messages = getValidationMessages(() => budget.validate());

      expect(
        messages.some((message) => message.includes("budget.userId")),
      ).toBe(true);
    });

    it("deve rejeitar userId que nao e uuid", () => {
      const budget = new Budget(buildProps({ userId: "nao-e-uuid" }));
      const messages = getValidationMessages(() => budget.validate());

      expect(
        messages.some((message) => message.includes("budget.userId")),
      ).toBe(true);
    });
  });

  it("deve acumular multiplos erros de validacao ao mesmo tempo", () => {
    const budget = new Budget(
      buildProps({
        categoryId: "nao-e-uuid",
        month: "invalido",
        limitAmount: -1,
        userId: "nao-e-uuid",
      }),
    );
    const messages = getValidationMessages(() => budget.validate());

    expect(messages.length).toBeGreaterThanOrEqual(4);
  });
});
