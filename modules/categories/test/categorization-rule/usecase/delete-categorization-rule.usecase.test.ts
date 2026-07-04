import { NotFoundError } from "@meubolso/shared";
import { DeleteCategorizationRule } from "../../../src/categorization-rule/usecase/delete-categorization-rule.usecase";
import { CategorizationRule } from "../../../src/categorization-rule/model/categorization-rule.entity";
import { FakeCategorizationRuleRepository } from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "99999999-9999-4999-8999-999999999999";
const CATEGORY_ID = "22222222-2222-4222-8222-222222222222";

function buildRule(userId = USER_ID): CategorizationRule {
  return new CategorizationRule({
    keyword: "uber",
    categoryId: CATEGORY_ID,
    priority: 0,
    userId,
  });
}

describe("DeleteCategorizationRule use case", () => {
  it("deve excluir a regra do usuario", async () => {
    const rule = buildRule();
    const ruleRepository = new FakeCategorizationRuleRepository([rule]);

    const useCase = new DeleteCategorizationRule(ruleRepository);
    await useCase.execute({ id: rule.id, userId: USER_ID });

    expect(ruleRepository.rules).toHaveLength(0);
  });

  it("deve lancar NotFoundError quando a regra nao existe", async () => {
    const ruleRepository = new FakeCategorizationRuleRepository();

    const useCase = new DeleteCategorizationRule(ruleRepository);

    await expect(
      useCase.execute({
        id: "33333333-3333-4333-8333-333333333333",
        userId: USER_ID,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve lancar NotFoundError quando a regra pertence a outro usuario", async () => {
    const rule = buildRule(OTHER_USER_ID);
    const ruleRepository = new FakeCategorizationRuleRepository([rule]);

    const useCase = new DeleteCategorizationRule(ruleRepository);

    await expect(
      useCase.execute({ id: rule.id, userId: USER_ID }),
    ).rejects.toThrow(NotFoundError);
  });
});
