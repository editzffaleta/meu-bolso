import { ValidationException } from "@meubolso/shared";
import { Account, AccountState } from "../../../src/account/model/account.entity";

const VALID_USER_ID = "11111111-1111-4111-8111-111111111111";

function buildProps(overrides: Partial<AccountState> = {}): AccountState {
  return {
    name: "Conta corrente",
    type: "checking",
    institution: "Banco X",
    initialBalance: 100,
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

describe("Account entity", () => {
  it("deve criar uma entidade valida com os getters corretos", () => {
    const account = new Account(buildProps());

    expect(account.name).toBe("Conta corrente");
    expect(account.type).toBe("checking");
    expect(account.institution).toBe("Banco X");
    expect(account.initialBalance).toBe(100);
    expect(account.userId).toBe(VALID_USER_ID);
    expect(account.id).toBeDefined();
    expect(account.createdAt).toBeInstanceOf(Date);
    expect(account.updatedAt).toBeInstanceOf(Date);
    expect(account.deletedAt).toBeNull();
  });

  it("deve aplicar default 0 para initialBalance quando nao informado", () => {
    const account = new Account(
      buildProps({ initialBalance: undefined as unknown as number }),
    );

    expect(account.initialBalance).toBe(0);
    expect(() => account.validate()).not.toThrow();
  });

  it("deve aceitar initialBalance negativo", () => {
    const account = new Account(buildProps({ initialBalance: -50.5 }));

    expect(() => account.validate()).not.toThrow();
    expect(account.initialBalance).toBe(-50.5);
  });

  it("deve permitir institution opcional (undefined)", () => {
    const account = new Account(buildProps({ institution: undefined }));

    expect(account.institution).toBeUndefined();
    expect(() => account.validate()).not.toThrow();
  });

  it("deve permitir existir invalida antes de validate() ser chamado (lazy)", () => {
    expect(
      () =>
        new Account(
          buildProps({
            name: "",
            type: "invalid" as unknown as AccountState["type"],
            userId: "nao-e-uuid",
          }),
        ),
    ).not.toThrow();
  });

  it("nao deve lancar erro ao validar uma entidade valida", () => {
    const account = new Account(buildProps());

    expect(() => account.validate()).not.toThrow();
  });

  it("clone() deve preservar id e createdAt e atualizar updatedAt", () => {
    const account = new Account(buildProps());
    const cloned = account.clone({ name: "Conta poupanca" });

    expect(cloned.id).toBe(account.id);
    expect(cloned.createdAt).toEqual(account.createdAt);
    expect(cloned.name).toBe("Conta poupanca");
  });

  describe("validacao de name", () => {
    it("deve rejeitar name vazio", () => {
      const account = new Account(buildProps({ name: "" }));
      const messages = getValidationMessages(() => account.validate());

      expect(messages.some((message) => message.includes("account.name"))).toBe(true);
    });
  });

  describe("validacao de type", () => {
    it("deve rejeitar type vazio", () => {
      const account = new Account(
        buildProps({ type: "" as unknown as AccountState["type"] }),
      );
      const messages = getValidationMessages(() => account.validate());

      expect(messages.some((message) => message.includes("account.type"))).toBe(true);
    });

    it("deve rejeitar type fora do enum permitido", () => {
      const account = new Account(
        buildProps({ type: "invalid" as unknown as AccountState["type"] }),
      );
      const messages = getValidationMessages(() => account.validate());

      expect(messages.some((message) => message.includes("account.type"))).toBe(true);
    });

    it.each(["checking", "savings", "wallet", "credit"] as const)(
      "deve aceitar type %s",
      (type) => {
        const account = new Account(buildProps({ type }));

        expect(() => account.validate()).not.toThrow();
      },
    );
  });

  describe("validacao de initialBalance", () => {
    it("deve rejeitar initialBalance com mais de 2 casas decimais", () => {
      const account = new Account(buildProps({ initialBalance: 10.123 }));
      const messages = getValidationMessages(() => account.validate());

      expect(
        messages.some((message) => message.includes("account.initialBalance")),
      ).toBe(true);
    });
  });

  describe("validacao de userId", () => {
    it("deve rejeitar userId vazio", () => {
      const account = new Account(buildProps({ userId: "" }));
      const messages = getValidationMessages(() => account.validate());

      expect(messages.some((message) => message.includes("account.userId"))).toBe(true);
    });

    it("deve rejeitar userId que nao e uuid", () => {
      const account = new Account(buildProps({ userId: "nao-e-uuid" }));
      const messages = getValidationMessages(() => account.validate());

      expect(messages.some((message) => message.includes("account.userId"))).toBe(true);
    });
  });

  it("deve acumular multiplos erros de validacao ao mesmo tempo", () => {
    const account = new Account(
      buildProps({
        name: "",
        type: "invalid" as unknown as AccountState["type"],
        userId: "nao-e-uuid",
      }),
    );
    const messages = getValidationMessages(() => account.validate());

    expect(messages.length).toBeGreaterThanOrEqual(3);
  });
});
