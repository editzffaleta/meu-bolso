import { Transaction } from "@meubolso/transactions";
import { RecategorizeAll } from "../../../src/categorization-rule/usecase/recategorize-all.usecase";
import { CategorizationRule } from "../../../src/categorization-rule/model/categorization-rule.entity";
import {
  FakeCategorizationRuleRepository,
  FakeTransactionCategorizationPort,
} from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const ACCOUNT_ID = "22222222-2222-4222-8222-222222222222";
const TRANSPORT_CATEGORY_ID = "33333333-3333-4333-8333-333333333333";
const FOOD_CATEGORY_ID = "44444444-4444-4444-8444-444444444444";

function buildTransaction(
  overrides: Partial<{ description: string; categoryId: string | null }> = {},
): Transaction {
  return new Transaction({
    date: new Date("2026-06-01T00:00:00.000Z"),
    description: overrides.description ?? "UBER *TRIP",
    type: "expense",
    amount: 25.9,
    accountId: ACCOUNT_ID,
    categoryId: overrides.categoryId,
    source: "import",
    fingerprint: `fp-${Math.random()}`,
    userId: USER_ID,
  });
}

function buildRule(
  overrides: Partial<{ keyword: string; categoryId: string; priority: number }> = {},
): CategorizationRule {
  return new CategorizationRule({
    keyword: overrides.keyword ?? "uber",
    categoryId: overrides.categoryId ?? TRANSPORT_CATEGORY_ID,
    priority: overrides.priority ?? 0,
    userId: USER_ID,
  });
}

describe("RecategorizeAll use case", () => {
  it("com includeAlreadyCategorized=false (padrao), so reavalia transacoes sem categoria", async () => {
    const withoutCategory = buildTransaction({ description: "UBER *TRIP" });
    const alreadyCategorized = buildTransaction({
      description: "UBER EATS",
      categoryId: FOOD_CATEGORY_ID,
    });
    const rule = buildRule({ keyword: "uber" });

    const ruleRepository = new FakeCategorizationRuleRepository([rule]);
    const transactionRepository = new FakeTransactionCategorizationPort([
      withoutCategory,
      alreadyCategorized,
    ]);

    const useCase = new RecategorizeAll(ruleRepository, transactionRepository);
    const result = await useCase.execute({ userId: USER_ID });

    expect(result).toEqual({ evaluated: 1, categorized: 1 });

    const updatedAlreadyCategorized = await transactionRepository.findById(
      alreadyCategorized.id,
      USER_ID,
    );
    expect(updatedAlreadyCategorized?.categoryId).toBe(FOOD_CATEGORY_ID);
  });

  it("com includeAlreadyCategorized=true, recategoriza apenas as transacoes que casam com alguma regra (nao zera antes)", async () => {
    const alreadyCategorized = buildTransaction({
      description: "UBER *TRIP",
      categoryId: FOOD_CATEGORY_ID,
    });
    const rule = buildRule({ keyword: "uber", categoryId: TRANSPORT_CATEGORY_ID });

    const ruleRepository = new FakeCategorizationRuleRepository([rule]);
    const transactionRepository = new FakeTransactionCategorizationPort([
      alreadyCategorized,
    ]);

    const useCase = new RecategorizeAll(ruleRepository, transactionRepository);
    const result = await useCase.execute({
      userId: USER_ID,
      includeAlreadyCategorized: true,
    });

    expect(result).toEqual({ evaluated: 1, categorized: 1 });

    const updated = await transactionRepository.findById(
      alreadyCategorized.id,
      USER_ID,
    );
    expect(updated?.categoryId).toBe(TRANSPORT_CATEGORY_ID);
  });

  it("com includeAlreadyCategorized=true e nenhuma regra casando, PRESERVA a categoria manual existente (nao zera)", async () => {
    const alreadyCategorized = buildTransaction({
      description: "Supermercado ABC",
      categoryId: FOOD_CATEGORY_ID,
    });
    const rule = buildRule({ keyword: "uber" });

    const ruleRepository = new FakeCategorizationRuleRepository([rule]);
    const transactionRepository = new FakeTransactionCategorizationPort([
      alreadyCategorized,
    ]);

    const useCase = new RecategorizeAll(ruleRepository, transactionRepository);
    const result = await useCase.execute({
      userId: USER_ID,
      includeAlreadyCategorized: true,
    });

    expect(result).toEqual({ evaluated: 1, categorized: 0 });

    const updated = await transactionRepository.findById(
      alreadyCategorized.id,
      USER_ID,
    );
    expect(updated?.categoryId).toBe(FOOD_CATEGORY_ID);
  });

  it("com includeAlreadyCategorized=true, nao chama updateMany quando nenhuma transacao casa com regra", async () => {
    const alreadyCategorized = buildTransaction({
      description: "Supermercado ABC",
      categoryId: FOOD_CATEGORY_ID,
    });
    const rule = buildRule({ keyword: "uber" });

    const ruleRepository = new FakeCategorizationRuleRepository([rule]);
    const transactionRepository = new FakeTransactionCategorizationPort([
      alreadyCategorized,
    ]);
    const updateManySpy = jest.spyOn(transactionRepository, "updateMany");

    const useCase = new RecategorizeAll(ruleRepository, transactionRepository);
    await useCase.execute({
      userId: USER_ID,
      includeAlreadyCategorized: true,
    });

    expect(updateManySpy).not.toHaveBeenCalled();
  });

  it("com includeAlreadyCategorized=true, transacao que ja tem a categoria correta (mesma da regra) nao e recontada como categorizada", async () => {
    const alreadyCorrect = buildTransaction({
      description: "UBER *TRIP",
      categoryId: TRANSPORT_CATEGORY_ID,
    });
    const rule = buildRule({ keyword: "uber", categoryId: TRANSPORT_CATEGORY_ID });

    const ruleRepository = new FakeCategorizationRuleRepository([rule]);
    const transactionRepository = new FakeTransactionCategorizationPort([
      alreadyCorrect,
    ]);

    const useCase = new RecategorizeAll(ruleRepository, transactionRepository);
    const result = await useCase.execute({
      userId: USER_ID,
      includeAlreadyCategorized: true,
    });

    expect(result).toEqual({ evaluated: 1, categorized: 0 });
  });

  it("falha no meio do lote (updateMany atomico) nao deixa estado parcial: todas as transacoes mantem a categoria anterior", async () => {
    const first = buildTransaction({
      description: "UBER *TRIP",
      categoryId: FOOD_CATEGORY_ID,
    });
    const second = buildTransaction({
      description: "UBER EATS",
      categoryId: null,
    });
    const rule = buildRule({ keyword: "uber", categoryId: TRANSPORT_CATEGORY_ID });

    const ruleRepository = new FakeCategorizationRuleRepository([rule]);
    const transactionRepository = new FakeTransactionCategorizationPort([
      first,
      second,
    ]);
    // Simula falha apos aplicar a primeira atualizacao do lote: o
    // `updateMany` real (Prisma `$transaction`) deve reverter tudo.
    transactionRepository.failAfter = 1;

    const useCase = new RecategorizeAll(ruleRepository, transactionRepository);

    await expect(
      useCase.execute({ userId: USER_ID, includeAlreadyCategorized: true }),
    ).rejects.toThrow();

    const updatedFirst = await transactionRepository.findById(first.id, USER_ID);
    const updatedSecond = await transactionRepository.findById(second.id, USER_ID);

    expect(updatedFirst?.categoryId).toBe(FOOD_CATEGORY_ID);
    expect(updatedSecond?.categoryId).toBeNull();
  });
});
