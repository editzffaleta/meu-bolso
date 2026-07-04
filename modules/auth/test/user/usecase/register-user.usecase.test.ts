import { DomainError, ValidationException } from "@meubolso/shared";
import { RegisterUser, User } from "../../../src";
import { FakeCryptoProvider, FakeUserRepository } from "../../mock";

const VALID_PASSWORD = "Strong@123";

describe("RegisterUser", () => {
  it("deve validar, criptografar a senha, criar e persistir o usuario no caminho feliz", async () => {
    const userRepository = new FakeUserRepository();
    const cryptoProvider = new FakeCryptoProvider();
    const validateSpy = jest.spyOn(User.prototype, "validate");
    const useCase = new RegisterUser(userRepository, cryptoProvider);

    await expect(
      useCase.execute({
        name: "Joao Silva",
        email: "joao@silva.com",
        password: VALID_PASSWORD,
      }),
    ).resolves.toBeUndefined();

    expect(userRepository.users).toHaveLength(1);
    expect(userRepository.users[0].email).toBe("joao@silva.com");
    expect(userRepository.users[0].password).toBe(
      await cryptoProvider.hash(VALID_PASSWORD),
    );
    expect(validateSpy).toHaveBeenCalledTimes(1);

    validateSpy.mockRestore();
  });

  it("deve rejeitar e-mail ja cadastrado com DomainError 409, sem persistir novamente", async () => {
    const userRepository = new FakeUserRepository();
    const cryptoProvider = new FakeCryptoProvider();
    const useCase = new RegisterUser(userRepository, cryptoProvider);

    await useCase.execute({
      name: "Joao Silva",
      email: "joao@silva.com",
      password: VALID_PASSWORD,
    });

    await expect(
      useCase.execute({
        name: "Outro Nome",
        email: "joao@silva.com",
        password: VALID_PASSWORD,
      }),
    ).rejects.toMatchObject({
      message: "user.email.already.registered",
      statusCode: 409,
    });

    expect(userRepository.users).toHaveLength(1);
  });

  it("deve rejeitar erro de DomainError como instancia esperada", async () => {
    const userRepository = new FakeUserRepository();
    const cryptoProvider = new FakeCryptoProvider();
    const useCase = new RegisterUser(userRepository, cryptoProvider);

    await useCase.execute({
      name: "Joao Silva",
      email: "duplicado@silva.com",
      password: VALID_PASSWORD,
    });

    await expect(
      useCase.execute({
        name: "Joao Silva",
        email: "duplicado@silva.com",
        password: VALID_PASSWORD,
      }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("deve rejeitar senha fraca antes de consultar o repositorio (validacao de entrada)", async () => {
    const userRepository = new FakeUserRepository();
    const cryptoProvider = new FakeCryptoProvider();
    const findByEmailSpy = jest.spyOn(userRepository, "findByEmail");
    const useCase = new RegisterUser(userRepository, cryptoProvider);

    await expect(
      useCase.execute({
        name: "Joao Silva",
        email: "joao@silva.com",
        password: "123456",
      }),
    ).rejects.toThrow(ValidationException);

    expect(findByEmailSpy).not.toHaveBeenCalled();
    expect(userRepository.users).toHaveLength(0);
  });

  it("deve rejeitar senha comum presente na lista de senhas proibidas", async () => {
    const userRepository = new FakeUserRepository();
    const cryptoProvider = new FakeCryptoProvider();
    const useCase = new RegisterUser(userRepository, cryptoProvider);

    await expect(
      useCase.execute({
        name: "Joao Silva",
        email: "joao@silva.com",
        password: "123456",
      }),
    ).rejects.toThrow(ValidationException);

    expect(userRepository.users).toHaveLength(0);
  });

  it("deve rejeitar senha vazia", async () => {
    const userRepository = new FakeUserRepository();
    const cryptoProvider = new FakeCryptoProvider();
    const useCase = new RegisterUser(userRepository, cryptoProvider);

    await expect(
      useCase.execute({
        name: "Joao Silva",
        email: "joao@silva.com",
        password: "",
      }),
    ).rejects.toThrow(ValidationException);
  });

  it("deve propagar falha de validacao de entidade quando os dados forem invalidos (ex.: nome vazio)", async () => {
    const userRepository = new FakeUserRepository();
    const cryptoProvider = new FakeCryptoProvider();
    const useCase = new RegisterUser(userRepository, cryptoProvider);

    await expect(
      useCase.execute({
        name: "",
        email: "joao@silva.com",
        password: VALID_PASSWORD,
      }),
    ).rejects.toThrow(ValidationException);

    expect(userRepository.users).toHaveLength(0);
  });

  it("deve propagar falha de validacao de entidade quando o e-mail for invalido", async () => {
    const userRepository = new FakeUserRepository();
    const cryptoProvider = new FakeCryptoProvider();
    const useCase = new RegisterUser(userRepository, cryptoProvider);

    await expect(
      useCase.execute({
        name: "Joao Silva",
        email: "nao-e-email",
        password: VALID_PASSWORD,
      }),
    ).rejects.toThrow(ValidationException);

    expect(userRepository.users).toHaveLength(0);
  });
});
