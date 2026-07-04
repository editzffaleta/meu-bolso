import { NotFoundError } from "@meubolso/shared";
import { GetTransaction, Transaction } from "../../../src";
import { FakeTransactionRepository } from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "99999999-9999-4999-8999-999999999999";

function buildTransaction(userId = USER_ID): Transaction {
  return new Transaction({
    date: new Date("2026-01-10T00:00:00.000Z"),
    description: "Mercado",
    type: "expense",
    amount: 150.5,
    accountId: "22222222-2222-4222-8222-222222222222",
    source: "manual",
    fingerprint: "abc123",
    userId,
  });
}

describe("GetTransaction", () => {
  it("deve retornar a transacao no caminho feliz", async () => {
    const transaction = buildTransaction();
    const transactionRepository = new FakeTransactionRepository([transaction]);
    const useCase = new GetTransaction(transactionRepository);

    const result = await useCase.execute({
      id: transaction.id,
      userId: USER_ID,
    });

    expect(result.id).toBe(transaction.id);
  });

  it("deve rejeitar id inexistente com NotFoundError", async () => {
    const transactionRepository = new FakeTransactionRepository();
    const useCase = new GetTransaction(transactionRepository);

    await expect(
      useCase.execute({
        id: "00000000-0000-4000-8000-000000000000",
        userId: USER_ID,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve rejeitar busca de transacao de outro usuario com NotFoundError", async () => {
    const transaction = buildTransaction(OTHER_USER_ID);
    const transactionRepository = new FakeTransactionRepository([transaction]);
    const useCase = new GetTransaction(transactionRepository);

    await expect(
      useCase.execute({ id: transaction.id, userId: USER_ID }),
    ).rejects.toThrow(NotFoundError);
  });
});
