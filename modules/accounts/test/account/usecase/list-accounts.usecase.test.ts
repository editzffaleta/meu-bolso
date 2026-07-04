import { Account, ListAccounts } from "../../../src";
import { FakeAccountRepository } from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";

function buildAccount(userId: string, name: string) {
  return new Account({
    name,
    type: "checking",
    initialBalance: 100,
    userId,
  });
}

describe("ListAccounts", () => {
  it("deve retornar apenas as contas do usuario informado", async () => {
    const ownAccount = buildAccount(USER_ID, "Conta propria");
    const otherAccount = buildAccount(OTHER_USER_ID, "Conta de outro usuario");
    const accountRepository = new FakeAccountRepository([ownAccount, otherAccount]);
    const useCase = new ListAccounts(accountRepository);

    const result = await useCase.execute({ userId: USER_ID });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(ownAccount.id);
  });

  it("deve retornar lista vazia quando o usuario nao tiver contas", async () => {
    const accountRepository = new FakeAccountRepository();
    const useCase = new ListAccounts(accountRepository);

    const result = await useCase.execute({ userId: USER_ID });

    expect(result).toEqual([]);
  });
});
