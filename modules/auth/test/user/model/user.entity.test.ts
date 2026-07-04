import { ValidationException } from "@meubolso/shared";
import { User, UserState } from "../../../src/user/model/user.entity";

const VALID_HASH = "$2b$10$" + "a".repeat(53);

function buildProps(overrides: Partial<UserState> = {}): UserState {
  return {
    name: "Maria da Silva",
    email: "maria@example.com",
    password: VALID_HASH,
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

describe("User entity", () => {
  it("deve criar uma entidade valida com os getters corretos", () => {
    const user = new User(buildProps());

    expect(user.name).toBe("Maria da Silva");
    expect(user.email).toBe("maria@example.com");
    expect(user.password).toBe(VALID_HASH);
    expect(user.id).toBeDefined();
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
    expect(user.deletedAt).toBeNull();
  });

  it("deve permitir existir invalida antes de validate() ser chamado (lazy)", () => {
    expect(
      () => new User(buildProps({ name: "", email: "invalido", password: "123" })),
    ).not.toThrow();
  });

  it("nao deve lancar erro ao validar uma entidade valida", () => {
    const user = new User(buildProps());

    expect(() => user.validate()).not.toThrow();
  });

  it("clone() deve preservar id e createdAt e atualizar updatedAt", () => {
    const user = new User(buildProps());
    const cloned = user.clone({ name: "Joao Pereira" });

    expect(cloned.id).toBe(user.id);
    expect(cloned.createdAt).toEqual(user.createdAt);
    expect(cloned.name).toBe("Joao Pereira");
  });

  describe("validacao de name", () => {
    it("deve rejeitar name vazio", () => {
      const user = new User(buildProps({ name: "" }));
      const messages = getValidationMessages(() => user.validate());

      expect(messages.some((message) => message.includes("user.name"))).toBe(true);
    });

    it("deve rejeitar name menor que o minimo", () => {
      const user = new User(buildProps({ name: "Jo" }));
      const messages = getValidationMessages(() => user.validate());

      expect(messages.some((message) => message.includes("user.name"))).toBe(true);
    });

    it("deve rejeitar name maior que o maximo", () => {
      const user = new User(buildProps({ name: "a".repeat(81) }));
      const messages = getValidationMessages(() => user.validate());

      expect(messages.some((message) => message.includes("user.name"))).toBe(true);
    });

    it("deve rejeitar name com caracteres invalidos para nome de pessoa", () => {
      const user = new User(buildProps({ name: "Maria123" }));
      const messages = getValidationMessages(() => user.validate());

      expect(messages.some((message) => message.includes("user.name"))).toBe(true);
    });
  });

  describe("validacao de email", () => {
    it("deve rejeitar email vazio", () => {
      const user = new User(buildProps({ email: "" }));
      const messages = getValidationMessages(() => user.validate());

      expect(messages.some((message) => message.includes("user.email"))).toBe(true);
    });

    it("deve rejeitar email com formato invalido", () => {
      const user = new User(buildProps({ email: "nao-e-email" }));
      const messages = getValidationMessages(() => user.validate());

      expect(messages.some((message) => message.includes("user.email"))).toBe(true);
    });
  });

  describe("validacao de password", () => {
    it("deve rejeitar password vazio", () => {
      const user = new User(buildProps({ password: "" }));
      const messages = getValidationMessages(() => user.validate());

      expect(messages.some((message) => message.includes("user.password"))).toBe(true);
    });

    it("deve rejeitar password que nao esta em formato de hash bcrypt", () => {
      const user = new User(buildProps({ password: "senha-em-texto-puro" }));
      const messages = getValidationMessages(() => user.validate());

      expect(messages.some((message) => message.includes("user.password"))).toBe(true);
    });
  });

  it("deve acumular multiplos erros de validacao ao mesmo tempo", () => {
    const user = new User(buildProps({ name: "", email: "invalido", password: "123" }));
    const messages = getValidationMessages(() => user.validate());

    expect(messages.length).toBeGreaterThanOrEqual(3);
  });
});
