import { NotFoundError } from "@meubolso/shared";
import { Account, FindAccountById } from "../../../src";
import { FakeAccountRepository } from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";

function buildAccount() {
  return new Account({
    name: "Conta corrente",
    type: "checking",
    initialBalance: 100,
    userId: USER_ID,
  });
}

describe("FindAccountById", () => {
  it("deve retornar a conta no caminho feliz", async () => {
    const account = buildAccount();
    const accountRepository = new FakeAccountRepository([account]);
    const useCase = new FindAccountById(accountRepository);

    const found = await useCase.execute({ id: account.id, userId: USER_ID });

    expect(found.id).toBe(account.id);
  });

  it("deve lancar NotFoundError quando o id nao existir", async () => {
    const accountRepository = new FakeAccountRepository();
    const useCase = new FindAccountById(accountRepository);

    await expect(
      useCase.execute({ id: "nao-existe", userId: USER_ID }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("deve lancar NotFoundError quando a conta existir mas pertencer a outro usuario", async () => {
    const account = buildAccount();
    const accountRepository = new FakeAccountRepository([account]);
    const useCase = new FindAccountById(accountRepository);

    await expect(
      useCase.execute({ id: account.id, userId: OTHER_USER_ID }),
    ).rejects.toMatchObject({ message: "account.not.found" });
  });
});
