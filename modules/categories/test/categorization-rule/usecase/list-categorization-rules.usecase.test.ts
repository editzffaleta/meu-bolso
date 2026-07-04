import { ListCategorizationRules } from "../../../src/categorization-rule/usecase/list-categorization-rules.usecase";
import { CategorizationRule } from "../../../src/categorization-rule/model/categorization-rule.entity";
import { FakeCategorizationRuleRepository } from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "99999999-9999-4999-8999-999999999999";
const CATEGORY_ID = "22222222-2222-4222-8222-222222222222";

function buildRule(userId = USER_ID, priority = 0): CategorizationRule {
  return new CategorizationRule({
    keyword: "uber",
    categoryId: CATEGORY_ID,
    priority,
    userId,
  });
}

describe("ListCategorizationRules use case", () => {
  it("deve listar somente as regras do usuario, ordenadas por priority desc", async () => {
    const ownLow = buildRule(USER_ID, 0);
    const ownHigh = buildRule(USER_ID, 10);
    const other = buildRule(OTHER_USER_ID, 20);

    const ruleRepository = new FakeCategorizationRuleRepository([
      ownLow,
      ownHigh,
      other,
    ]);

    const useCase = new ListCategorizationRules(ruleRepository);
    const result = await useCase.execute({ userId: USER_ID });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(ownHigh.id);
    expect(result[1].id).toBe(ownLow.id);
  });

  it("deve retornar lista vazia quando o usuario nao possui regras", async () => {
    const ruleRepository = new FakeCategorizationRuleRepository();

    const useCase = new ListCategorizationRules(ruleRepository);
    const result = await useCase.execute({ userId: USER_ID });

    expect(result).toEqual([]);
  });
});
