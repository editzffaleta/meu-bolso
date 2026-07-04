import { Transaction } from "@meubolso/transactions";
import { ApplyRules } from "../../../src/categorization-rule/usecase/apply-rules.usecase";
import { CategorizationRule } from "../../../src/categorization-rule/model/categorization-rule.entity";
import {
  FakeCategorizationRuleRepository,
  FakeTransactionCategorizationPort,
} from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "99999999-9999-4999-8999-999999999999";
const ACCOUNT_ID = "22222222-2222-4222-8222-222222222222";
const TRANSPORT_CATEGORY_ID = "33333333-3333-4333-8333-333333333333";
const FOOD_CATEGORY_ID = "44444444-4444-4444-8444-444444444444";

function buildTransaction(
  overrides: Partial<{
    description: string;
    categoryId: string | null;
    userId: string;
  }> = {},
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
    userId: overrides.userId ?? USER_ID,
  });
}

function buildRule(
  overrides: Partial<{
    keyword: string;
    categoryId: string;
    priority: number;
    userId: string;
  }> = {},
): CategorizationRule {
  return new CategorizationRule({
    keyword: overrides.keyword ?? "uber",
    categoryId: overrides.categoryId ?? TRANSPORT_CATEGORY_ID,
    priority: overrides.priority ?? 0,
    userId: overrides.userId ?? USER_ID,
  });
}

describe("ApplyRules use case", () => {
  it("deve categorizar transacoes cuja description contem a keyword da regra", async () => {
    const transaction = buildTransaction({ description: "UBER *TRIP" });
    const rule = buildRule({ keyword: "uber" });

    const ruleRepository = new FakeCategorizationRuleRepository([rule]);
    const transactionRepository = new FakeTransactionCategorizationPort([transaction]);

    const useCase = new ApplyRules(ruleRepository, transactionRepository);
    const result = await useCase.execute({
      userId: USER_ID,
      transactionIds: [transaction.id],
    });

    expect(result).toEqual({ evaluated: 1, categorized: 1 });
    const updated = await transactionRepository.findById(transaction.id, USER_ID);
    expect(updated?.categoryId).toBe(TRANSPORT_CATEGORY_ID);
  });

  it("deve respeitar a prioridade das regras (maior priority primeiro)", async () => {
    const transaction = buildTransaction({ description: "UBER EATS" });
    const genericRule = buildRule({
      keyword: "uber",
      categoryId: TRANSPORT_CATEGORY_ID,
      priority: 0,
    });
    const specificRule = buildRule({
      keyword: "uber eats",
      categoryId: FOOD_CATEGORY_ID,
      priority: 10,
    });

    const ruleRepository = new FakeCategorizationRuleRepository([
      genericRule,
      specificRule,
    ]);
    const transactionRepository = new FakeTransactionCategorizationPort([transaction]);

    const useCase = new ApplyRules(ruleRepository, transactionRepository);
    await useCase.execute({ userId: USER_ID, transactionIds: [transaction.id] });

    const updated = await transactionRepository.findById(transaction.id, USER_ID);
    expect(updated?.categoryId).toBe(FOOD_CATEGORY_ID);
  });

  it("nao deve sobrescrever categoryId ja preenchido", async () => {
    const transaction = buildTransaction({
      description: "UBER *TRIP",
      categoryId: FOOD_CATEGORY_ID,
    });
    const rule = buildRule({ keyword: "uber", categoryId: TRANSPORT_CATEGORY_ID });

    const ruleRepository = new FakeCategorizationRuleRepository([rule]);
    const transactionRepository = new FakeTransactionCategorizationPort([transaction]);

    const useCase = new ApplyRules(ruleRepository, transactionRepository);
    const result = await useCase.execute({
      userId: USER_ID,
      transactionIds: [transaction.id],
    });

    expect(result).toEqual({ evaluated: 0, categorized: 0 });
    const updated = await transactionRepository.findById(transaction.id, USER_ID);
    expect(updated?.categoryId).toBe(FOOD_CATEGORY_ID);
  });

  it("deve manter a transacao sem categoria quando nenhuma regra casa", async () => {
    const transaction = buildTransaction({ description: "Supermercado ABC" });
    const rule = buildRule({ keyword: "uber" });

    const ruleRepository = new FakeCategorizationRuleRepository([rule]);
    const transactionRepository = new FakeTransactionCategorizationPort([transaction]);

    const useCase = new ApplyRules(ruleRepository, transactionRepository);
    const result = await useCase.execute({
      userId: USER_ID,
      transactionIds: [transaction.id],
    });

    expect(result).toEqual({ evaluated: 1, categorized: 0 });
    const updated = await transactionRepository.findById(transaction.id, USER_ID);
    expect(updated?.categoryId).toBeUndefined();
  });

  it("deve usar as transacoes sem categoria do usuario quando transactionIds nao e informado", async () => {
    const transaction = buildTransaction({ description: "UBER *TRIP" });
    const otherUserTransaction = buildTransaction({
      description: "UBER *TRIP",
      userId: OTHER_USER_ID,
    });
    const rule = buildRule({ keyword: "uber" });

    const ruleRepository = new FakeCategorizationRuleRepository([rule]);
    const transactionRepository = new FakeTransactionCategorizationPort([
      transaction,
      otherUserTransaction,
    ]);

    const useCase = new ApplyRules(ruleRepository, transactionRepository);
    const result = await useCase.execute({ userId: USER_ID });

    expect(result).toEqual({ evaluated: 1, categorized: 1 });
    const otherUpdated = await transactionRepository.findById(
      otherUserTransaction.id,
      OTHER_USER_ID,
    );
    expect(otherUpdated?.categoryId).toBeUndefined();
  });
});
