import { ValidationException } from "@meubolso/shared";
import {
  Transaction,
  TransactionState,
} from "../../../src/transaction/model/transaction.entity";

const VALID_USER_ID = "11111111-1111-4111-8111-111111111111";
const VALID_ACCOUNT_ID = "22222222-2222-4222-8222-222222222222";
const VALID_CATEGORY_ID = "33333333-3333-4333-8333-333333333333";

function buildProps(overrides: Partial<TransactionState> = {}): TransactionState {
  return {
    date: new Date("2026-01-10T00:00:00.000Z"),
    description: "Mercado",
    type: "expense",
    amount: 150.5,
    accountId: VALID_ACCOUNT_ID,
    categoryId: VALID_CATEGORY_ID,
    source: "manual",
    fingerprint: "abc123",
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

describe("Transaction entity", () => {
  it("deve criar uma entidade valida com os getters corretos", () => {
    const transaction = new Transaction(buildProps());

    expect(transaction.date).toEqual(new Date("2026-01-10T00:00:00.000Z"));
    expect(transaction.description).toBe("Mercado");
    expect(transaction.type).toBe("expense");
    expect(transaction.amount).toBe(150.5);
    expect(transaction.accountId).toBe(VALID_ACCOUNT_ID);
    expect(transaction.categoryId).toBe(VALID_CATEGORY_ID);
    expect(transaction.source).toBe("manual");
    expect(transaction.fingerprint).toBe("abc123");
    expect(transaction.userId).toBe(VALID_USER_ID);
    expect(transaction.id).toBeDefined();
    expect(transaction.createdAt).toBeInstanceOf(Date);
    expect(transaction.updatedAt).toBeInstanceOf(Date);
    expect(transaction.deletedAt).toBeNull();
  });

  it("deve aplicar default manual para source quando nao informado", () => {
    const transaction = new Transaction(
      buildProps({ source: undefined as unknown as "manual" }),
    );

    expect(transaction.source).toBe("manual");
    expect(() => transaction.validate()).not.toThrow();
  });

  it("deve permitir categoryId opcional (undefined)", () => {
    const transaction = new Transaction(buildProps({ categoryId: undefined }));

    expect(transaction.categoryId).toBeUndefined();
    expect(() => transaction.validate()).not.toThrow();
  });

  it("deve permitir importId opcional (undefined)", () => {
    const transaction = new Transaction(buildProps({ importId: undefined }));

    expect(transaction.importId).toBeUndefined();
    expect(() => transaction.validate()).not.toThrow();
  });

  it("deve permitir existir invalida antes de validate() ser chamado (lazy)", () => {
    expect(
      () =>
        new Transaction(
          buildProps({
            description: "",
            type: "invalid" as unknown as TransactionState["type"],
            amount: -10,
            accountId: "nao-e-uuid",
            userId: "nao-e-uuid",
          }),
        ),
    ).not.toThrow();
  });

  it("nao deve lancar erro ao validar uma entidade valida", () => {
    const transaction = new Transaction(buildProps());

    expect(() => transaction.validate()).not.toThrow();
  });

  it("clone() deve preservar id e createdAt e atualizar updatedAt", () => {
    const transaction = new Transaction(buildProps());
    const cloned = transaction.clone({ description: "Mercado atualizado" });

    expect(cloned.id).toBe(transaction.id);
    expect(cloned.createdAt).toEqual(transaction.createdAt);
    expect(cloned.description).toBe("Mercado atualizado");
  });

  describe("validacao de date", () => {
    it("deve rejeitar date invalida", () => {
      const transaction = new Transaction(
        buildProps({ date: new Date("data-invalida") }),
      );
      const messages = getValidationMessages(() => transaction.validate());

      expect(
        messages.some((message) => message.includes("transaction.date")),
      ).toBe(true);
    });
  });

  describe("validacao de description", () => {
    it("deve rejeitar description vazia", () => {
      const transaction = new Transaction(buildProps({ description: "" }));
      const messages = getValidationMessages(() => transaction.validate());

      expect(
        messages.some((message) => message.includes("transaction.description")),
      ).toBe(true);
    });
  });

  describe("validacao de type", () => {
    it("deve rejeitar type vazio", () => {
      const transaction = new Transaction(
        buildProps({ type: "" as unknown as TransactionState["type"] }),
      );
      const messages = getValidationMessages(() => transaction.validate());

      expect(
        messages.some((message) => message.includes("transaction.type")),
      ).toBe(true);
    });

    it("deve rejeitar type fora do enum permitido", () => {
      const transaction = new Transaction(
        buildProps({
          type: "invalid" as unknown as TransactionState["type"],
        }),
      );
      const messages = getValidationMessages(() => transaction.validate());

      expect(
        messages.some((message) => message.includes("transaction.type")),
      ).toBe(true);
    });

    it.each(["income", "expense"] as const)(
      "deve aceitar type %s",
      (type) => {
        const transaction = new Transaction(buildProps({ type }));

        expect(() => transaction.validate()).not.toThrow();
      },
    );
  });

  describe("validacao de amount", () => {
    it("deve rejeitar amount zero", () => {
      const transaction = new Transaction(buildProps({ amount: 0 }));
      const messages = getValidationMessages(() => transaction.validate());

      expect(
        messages.some((message) => message.includes("transaction.amount")),
      ).toBe(true);
    });

    it("deve rejeitar amount negativo independente do type", () => {
      const expenseTransaction = new Transaction(
        buildProps({ amount: -10, type: "expense" }),
      );
      const incomeTransaction = new Transaction(
        buildProps({ amount: -10, type: "income" }),
      );

      expect(
        getValidationMessages(() => expenseTransaction.validate()).some(
          (message) => message.includes("transaction.amount"),
        ),
      ).toBe(true);
      expect(
        getValidationMessages(() => incomeTransaction.validate()).some(
          (message) => message.includes("transaction.amount"),
        ),
      ).toBe(true);
    });

    it("deve aceitar amount positivo", () => {
      const transaction = new Transaction(buildProps({ amount: 0.01 }));

      expect(() => transaction.validate()).not.toThrow();
    });
  });

  describe("validacao de accountId", () => {
    it("deve rejeitar accountId vazio", () => {
      const transaction = new Transaction(buildProps({ accountId: "" }));
      const messages = getValidationMessages(() => transaction.validate());

      expect(
        messages.some((message) => message.includes("transaction.accountId")),
      ).toBe(true);
    });

    it("deve rejeitar accountId que nao e uuid", () => {
      const transaction = new Transaction(
        buildProps({ accountId: "nao-e-uuid" }),
      );
      const messages = getValidationMessages(() => transaction.validate());

      expect(
        messages.some((message) => message.includes("transaction.accountId")),
      ).toBe(true);
    });
  });

  describe("validacao de categoryId", () => {
    it("deve rejeitar categoryId que nao e uuid quando informado", () => {
      const transaction = new Transaction(
        buildProps({ categoryId: "nao-e-uuid" }),
      );
      const messages = getValidationMessages(() => transaction.validate());

      expect(
        messages.some((message) => message.includes("transaction.categoryId")),
      ).toBe(true);
    });
  });

  describe("validacao de userId", () => {
    it("deve rejeitar userId vazio", () => {
      const transaction = new Transaction(buildProps({ userId: "" }));
      const messages = getValidationMessages(() => transaction.validate());

      expect(
        messages.some((message) => message.includes("transaction.userId")),
      ).toBe(true);
    });

    it("deve rejeitar userId que nao e uuid", () => {
      const transaction = new Transaction(
        buildProps({ userId: "nao-e-uuid" }),
      );
      const messages = getValidationMessages(() => transaction.validate());

      expect(
        messages.some((message) => message.includes("transaction.userId")),
      ).toBe(true);
    });
  });

  it("deve acumular multiplos erros de validacao ao mesmo tempo", () => {
    const transaction = new Transaction(
      buildProps({
        description: "",
        type: "invalid" as unknown as TransactionState["type"],
        amount: -1,
        accountId: "nao-e-uuid",
        userId: "nao-e-uuid",
      }),
    );
    const messages = getValidationMessages(() => transaction.validate());

    expect(messages.length).toBeGreaterThanOrEqual(5);
  });
});
