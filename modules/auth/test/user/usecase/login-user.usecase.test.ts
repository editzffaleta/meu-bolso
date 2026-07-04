import { DomainError, ValidationException } from "@meubolso/shared";
import { LoginUser, User } from "../../../src";
import { FakeCryptoProvider, FakeUserRepository } from "../../mock";

const VALID_PASSWORD = "Strong@123";

async function createExistingUser(
  cryptoProvider: FakeCryptoProvider,
  overrides: Partial<{ name: string; email: string; password: string }> = {},
): Promise<User> {
  const hashedPassword = await cryptoProvider.hash(
    overrides.password ?? VALID_PASSWORD,
  );

  return new User({
    name: overrides.name ?? "Joao Silva",
    email: overrides.email ?? "joao@silva.com",
    password: hashedPassword,
  });
}

describe("LoginUser", () => {
  it("deve autenticar com credenciais validas e devolver apenas atributos publicos", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const existingUser = await createExistingUser(cryptoProvider);
    const userRepository = new FakeUserRepository([existingUser]);
    const useCase = new LoginUser(userRepository, cryptoProvider);

    const result = await useCase.execute({
      email: "joao@silva.com",
      password: VALID_PASSWORD,
    });

    expect(result).toEqual({
      id: existingUser.id,
      name: "Joao Silva",
      email: "joao@silva.com",
    });
    expect(result).not.toHaveProperty("password");
  });

  it("deve rejeitar e-mail inexistente com DomainError 401 (mensagem generica)", async () => {
    const userRepository = new FakeUserRepository();
    const cryptoProvider = new FakeCryptoProvider();
    const useCase = new LoginUser(userRepository, cryptoProvider);

    await expect(
      useCase.execute({
        email: "inexistente@silva.com",
        password: VALID_PASSWORD,
      }),
    ).rejects.toMatchObject({
      message: "user.credentials.invalid",
      statusCode: 401,
    });
  });

  it("deve rejeitar senha incorreta com a mesma DomainError 401", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const existingUser = await createExistingUser(cryptoProvider);
    const userRepository = new FakeUserRepository([existingUser]);
    const useCase = new LoginUser(userRepository, cryptoProvider);

    await expect(
      useCase.execute({
        email: "joao@silva.com",
        password: "SenhaErrada@123",
      }),
    ).rejects.toMatchObject({
      message: "user.credentials.invalid",
      statusCode: 401,
    });
  });

  it("deve rejeitar erro de credenciais invalidas como instancia de DomainError", async () => {
    const userRepository = new FakeUserRepository();
    const cryptoProvider = new FakeCryptoProvider();
    const useCase = new LoginUser(userRepository, cryptoProvider);

    await expect(
      useCase.execute({
        email: "inexistente@silva.com",
        password: VALID_PASSWORD,
      }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("deve rejeitar e-mail vazio antes de consultar o repositorio", async () => {
    const userRepository = new FakeUserRepository();
    const cryptoProvider = new FakeCryptoProvider();
    const findByEmailSpy = jest.spyOn(userRepository, "findByEmail");
    const useCase = new LoginUser(userRepository, cryptoProvider);

    await expect(
      useCase.execute({
        email: "",
        password: VALID_PASSWORD,
      }),
    ).rejects.toThrow(ValidationException);

    expect(findByEmailSpy).not.toHaveBeenCalled();
  });

  it("deve rejeitar e-mail invalido", async () => {
    const userRepository = new FakeUserRepository();
    const cryptoProvider = new FakeCryptoProvider();
    const useCase = new LoginUser(userRepository, cryptoProvider);

    await expect(
      useCase.execute({
        email: "nao-e-email",
        password: VALID_PASSWORD,
      }),
    ).rejects.toThrow(ValidationException);
  });

  it("deve rejeitar senha vazia", async () => {
    const userRepository = new FakeUserRepository();
    const cryptoProvider = new FakeCryptoProvider();
    const useCase = new LoginUser(userRepository, cryptoProvider);

    await expect(
      useCase.execute({
        email: "joao@silva.com",
        password: "",
      }),
    ).rejects.toThrow(ValidationException);
  });
});
