import { NotFoundError, ValidationException } from "@meubolso/shared";
import { CreateCategorizationRule } from "../../../src/categorization-rule/usecase/create-categorization-rule.usecase";
import { Category } from "../../../src/category/model";
import {
  FakeCategorizationRuleRepository,
  FakeCategoryRepository,
} from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "99999999-9999-4999-8999-999999999999";

function buildCategory(userId = USER_ID): Category {
  return new Category({
    name: "Transporte",
    type: "expense",
    color: "#059669",
    userId,
    isDefault: false,
  });
}

describe("CreateCategorizationRule use case", () => {
  it("deve criar uma regra quando categoryId pertence ao usuario", async () => {
    const category = buildCategory();
    const ruleRepository = new FakeCategorizationRuleRepository();
    const categoryRepository = new FakeCategoryRepository([category]);

    const useCase = new CreateCategorizationRule(
      ruleRepository,
      categoryRepository,
    );

    const rule = await useCase.execute({
      keyword: "uber",
      categoryId: category.id,
      userId: USER_ID,
    });

    expect(rule.keyword).toBe("uber");
    expect(rule.categoryId).toBe(category.id);
    expect(rule.priority).toBe(0);
    expect(ruleRepository.rules).toHaveLength(1);
  });

  it("deve lancar NotFoundError quando categoryId nao existe", async () => {
    const ruleRepository = new FakeCategorizationRuleRepository();
    const categoryRepository = new FakeCategoryRepository([]);

    const useCase = new CreateCategorizationRule(
      ruleRepository,
      categoryRepository,
    );

    await expect(
      useCase.execute({
        keyword: "uber",
        categoryId: "22222222-2222-4222-8222-222222222222",
        userId: USER_ID,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve lancar NotFoundError quando categoryId pertence a outro usuario", async () => {
    const category = buildCategory(OTHER_USER_ID);
    const ruleRepository = new FakeCategorizationRuleRepository();
    const categoryRepository = new FakeCategoryRepository([category]);

    const useCase = new CreateCategorizationRule(
      ruleRepository,
      categoryRepository,
    );

    await expect(
      useCase.execute({
        keyword: "uber",
        categoryId: category.id,
        userId: USER_ID,
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve lancar erro de validacao quando keyword e vazia", async () => {
    const category = buildCategory();
    const ruleRepository = new FakeCategorizationRuleRepository();
    const categoryRepository = new FakeCategoryRepository([category]);

    const useCase = new CreateCategorizationRule(
      ruleRepository,
      categoryRepository,
    );

    await expect(
      useCase.execute({
        keyword: "   ",
        categoryId: category.id,
        userId: USER_ID,
      }),
    ).rejects.toThrow(ValidationException);
  });

  it("deve aceitar priority customizado", async () => {
    const category = buildCategory();
    const ruleRepository = new FakeCategorizationRuleRepository();
    const categoryRepository = new FakeCategoryRepository([category]);

    const useCase = new CreateCategorizationRule(
      ruleRepository,
      categoryRepository,
    );

    const rule = await useCase.execute({
      keyword: "uber",
      categoryId: category.id,
      priority: 5,
      userId: USER_ID,
    });

    expect(rule.priority).toBe(5);
  });
});
