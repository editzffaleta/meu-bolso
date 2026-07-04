import { NotFoundError, ValidationException } from "@meubolso/shared";
import { Account, AccountState, UpdateAccount } from "../../../src";
import { FakeAccountRepository } from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";

function buildAccount(overrides: Partial<AccountState> = {}): Account {
  return new Account({
    name: "Conta corrente",
    type: "checking",
    initialBalance: 100,
    userId: USER_ID,
    ...overrides,
  });
}

describe("UpdateAccount", () => {
  it("deve atualizar os campos informados no caminho feliz", async () => {
    const account = buildAccount();
    const accountRepository = new FakeAccountRepository([account]);
    const useCase = new UpdateAccount(accountRepository);

    const updated = await useCase.execute({
      id: account.id,
      userId: USER_ID,
      name: "Conta atualizada",
      initialBalance: 500,
    });

    expect(updated.name).toBe("Conta atualizada");
    expect(updated.initialBalance).toBe(500);
    expect(updated.type).toBe("checking");
  });

  it("deve atualizar a institution quando informada", async () => {
    const account = buildAccount();
    const accountRepository = new FakeAccountRepository([account]);
    const useCase = new UpdateAccount(accountRepository);

    const updated = await useCase.execute({
      id: account.id,
      userId: USER_ID,
      institution: "Banco Novo",
    });

    expect(updated.institution).toBe("Banco Novo");
  });

  it("deve lancar NotFoundError quando o id nao existir", async () => {
    const accountRepository = new FakeAccountRepository();
    const useCase = new UpdateAccount(accountRepository);

    await expect(
      useCase.execute({ id: "nao-existe", userId: USER_ID, name: "X" }),
    ).rejects.toMatchObject({
      message: "account.not.found",
    });
  });

  it("deve lancar NotFoundError quando a conta existir mas pertencer a outro usuario", async () => {
    const account = buildAccount();
    const accountRepository = new FakeAccountRepository([account]);
    const useCase = new UpdateAccount(accountRepository);

    await expect(
      useCase.execute({ id: account.id, userId: OTHER_USER_ID, name: "X" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("deve rejeitar atualizacao com dados invalidos (name vazio)", async () => {
    const account = buildAccount();
    const accountRepository = new FakeAccountRepository([account]);
    const useCase = new UpdateAccount(accountRepository);

    await expect(
      useCase.execute({ id: account.id, userId: USER_ID, name: "" }),
    ).rejects.toThrow(ValidationException);
  });
});
