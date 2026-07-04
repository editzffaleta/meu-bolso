import {
  Entity,
  EntityState,
  PositiveRule,
  RegexRule,
  RequiredRule,
  UuidRule,
  Validator,
} from "@meubolso/shared";

export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface BudgetState extends EntityState {
  categoryId: string;
  month: string;
  limitAmount: number;
  userId: string;
}

export class Budget extends Entity<BudgetState> {
  constructor(props: BudgetState) {
    super(props);
  }

  get categoryId(): string {
    return this.props.categoryId;
  }

  get month(): string {
    return this.props.month;
  }

  get limitAmount(): number {
    return this.props.limitAmount;
  }

  get userId(): string {
    return this.props.userId;
  }

  public validate(): void {
    Validator.validate([
      {
        code: "budget.categoryId",
        value: this.categoryId,
        rules: [new RequiredRule(), new UuidRule()],
      },
      {
        code: "budget.month",
        value: this.month,
        rules: [new RequiredRule(), new RegexRule(MONTH_PATTERN)],
      },
      {
        code: "budget.limitAmount",
        value: this.limitAmount,
        rules: [new RequiredRule(), new PositiveRule()],
      },
      {
        code: "budget.userId",
        value: this.userId,
        rules: [new RequiredRule(), new UuidRule()],
      },
    ]);
  }
}
