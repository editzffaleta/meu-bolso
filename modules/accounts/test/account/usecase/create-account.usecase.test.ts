import { ValidationException } from "@meubolso/shared";
import { CreateAccount } from "../../../src";
import { FakeAccountRepository } from "../../mock";

const VALID_USER_ID = "11111111-1111-4111-8111-111111111111";

describe("CreateAccount", () => {
  it("deve criar e persistir a conta com initialBalance default 0 no caminho feliz", async () => {
    const accountRepository = new FakeAccountRepository();
    const useCase = new CreateAccount(accountRepository);

    const account = await useCase.execute({
      name: "Conta corrente",
      type: "checking",
      userId: VALID_USER_ID,
    });

    expect(account.name).toBe("Conta corrente");
    expect(account.initialBalance).toBe(0);
    expect(account.userId).toBe(VALID_USER_ID);
    expect(accountRepository.accounts).toHaveLength(1);
  });

  it("deve criar a conta com initialBalance e institution informados", async () => {
    const accountRepository = new FakeAccountRepository();
    const useCase = new CreateAccount(accountRepository);

    const account = await useCase.execute({
      name: "Conta poupanca",
      type: "savings",
      institution: "Banco Y",
      initialBalance: 250.55,
      userId: VALID_USER_ID,
    });

    expect(account.institution).toBe("Banco Y");
    expect(account.initialBalance).toBe(250.55);
  });

  it("deve rejeitar name vazio com ValidationException, sem persistir", async () => {
    const accountRepository = new FakeAccountRepository();
    const useCase = new CreateAccount(accountRepository);

    await expect(
      useCase.execute({
        name: "",
        type: "checking",
        userId: VALID_USER_ID,
      }),
    ).rejects.toThrow(ValidationException);

    expect(accountRepository.accounts).toHaveLength(0);
  });

  it("deve rejeitar type fora do enum permitido, sem persistir", async () => {
    const accountRepository = new FakeAccountRepository();
    const useCase = new CreateAccount(accountRepository);

    await expect(
      useCase.execute({
        name: "Conta corrente",
        type: "invalid" as never,
        userId: VALID_USER_ID,
      }),
    ).rejects.toThrow(ValidationException);

    expect(accountRepository.accounts).toHaveLength(0);
  });
});
