import {
  Entity,
  EntityState,
  IntegerRule,
  RequiredRule,
  UuidRule,
  Validator,
} from "@meubolso/shared";

export interface CategorizationRuleState extends EntityState {
  keyword: string;
  categoryId: string;
  priority: number;
  userId: string;
}

export class CategorizationRule extends Entity<CategorizationRuleState> {
  constructor(props: CategorizationRuleState) {
    super({
      ...props,
      keyword: props.keyword?.trim(),
      priority: props.priority ?? 0,
    });
  }

  get keyword(): string {
    return this.props.keyword;
  }

  get categoryId(): string {
    return this.props.categoryId;
  }

  get priority(): number {
    return this.props.priority;
  }

  get userId(): string {
    return this.props.userId;
  }

  /**
   * Testa se a `description` informada casa com esta regra: comparacao
   * case-insensitive, `description` contendo a `keyword` da regra.
   */
  matches(description: string): boolean {
    return description.toLowerCase().includes(this.keyword.toLowerCase());
  }

  public validate(): void {
    Validator.validate([
      {
        code: "categorization-rule.keyword",
        value: this.keyword,
        rules: [new RequiredRule()],
      },
      {
        code: "categorization-rule.categoryId",
        value: this.categoryId,
        rules: [new RequiredRule(), new UuidRule()],
      },
      {
        code: "categorization-rule.priority",
        value: this.priority,
        rules: [new RequiredRule(), new IntegerRule()],
      },
      {
        code: "categorization-rule.userId",
        value: this.userId,
        rules: [new RequiredRule(), new UuidRule()],
      },
    ]);
  }
}
