import { NotFoundError } from "@meubolso/shared";
import { UpdateCategorizationRule } from "../../../src/categorization-rule/usecase/update-categorization-rule.usecase";
import { CategorizationRule } from "../../../src/categorization-rule/model/categorization-rule.entity";
import { Category } from "../../../src/category/model";
import {
  FakeCategorizationRuleRepository,
  FakeCategoryRepository,
} from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "99999999-9999-4999-8999-999999999999";
const CATEGORY_ID = "22222222-2222-4222-8222-222222222222";

function buildCategory(id?: string, userId = USER_ID): Category {
  return new Category({
    id,
    name: "Transporte",
    type: "expense",
    color: "#059669",
    userId,
    isDefault: false,
  });
}

function buildRule(userId = USER_ID): CategorizationRule {
  return new CategorizationRule({
    keyword: "uber",
    categoryId: CATEGORY_ID,
    priority: 0,
    userId,
  });
}

describe("UpdateCategorizationRule use case", () => {
  it("deve atualizar keyword, categoryId e priority", async () => {
    const rule = buildRule();
    const newCategory = buildCategory();

    const ruleRepository = new FakeCategorizationRuleRepository([rule]);
    const categoryRepository = new FakeCategoryRepository([newCategory]);

    const useCase = new UpdateCategorizationRule(
      ruleRepository,
      categoryRepository,
    );

    const updated = await useCase.execute({
      id: rule.id,
      userId: USER_ID,
      keyword: "99app",
      categoryId: newCategory.id,
      priority: 7,
    });

    expect(updated.keyword).toBe("99app");
    expect(updated.categoryId).toBe(newCategory.id);
    expect(updated.priority).toBe(7);
  });

  it("deve lancar NotFoundError quando a regra nao existe", async () => {
    const ruleRepository = new FakeCategorizationRuleRepository();
    const categoryRepository = new FakeCategoryRepository();

    const useCase = new UpdateCategorizationRule(
      ruleRepository,
      categoryRepository,
    );

    await expect(
      useCase.execute({
        id: "33333333-3333-4333-8333-333333333333",
        userId: USER_ID,
        keyword: "99app",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve lancar NotFoundError quando a regra pertence a outro usuario", async () => {
    const rule = buildRule(OTHER_USER_ID);
    const ruleRepository = new FakeCategorizationRuleRepository([rule]);
    const categoryRepository = new FakeCategoryRepository();

    const useCase = new UpdateCategorizationRule(
      ruleRepository,
      categoryRepository,
    );

    await expect(
      useCase.execute({
        id: rule.id,
        userId: USER_ID,
        keyword: "99app",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve manter categoryId/keyword/priority atuais quando nao informados", async () => {
    const rule = buildRule();
    const ruleRepository = new FakeCategorizationRuleRepository([rule]);
    const categoryRepository = new FakeCategoryRepository();

    const useCase = new UpdateCategorizationRule(
      ruleRepository,
      categoryRepository,
    );

    const updated = await useCase.execute({ id: rule.id, userId: USER_ID });

    expect(updated.keyword).toBe(rule.keyword);
    expect(updated.categoryId).toBe(rule.categoryId);
    expect(updated.priority).toBe(rule.priority);
  });

  it("deve lancar NotFoundError quando o novo categoryId nao pertence ao usuario", async () => {
    const rule = buildRule();
    const foreignCategory = buildCategory(undefined, OTHER_USER_ID);

    const ruleRepository = new FakeCategorizationRuleRepository([rule]);
    const categoryRepository = new FakeCategoryRepository([foreignCategory]);

    const useCase = new UpdateCategorizationRule(
      ruleRepository,
      categoryRepository,
    );

    await expect(
      useCase.execute({
        id: rule.id,
        userId: USER_ID,
        categoryId: foreignCategory.id,
      }),
    ).rejects.toThrow(NotFoundError);
  });
});
