import {
  Entity,
  EntityState,
  InRule,
  PrecisionRule,
  RequiredRule,
  UuidRule,
  Validator,
} from "@meubolso/shared";

export type AccountType = "checking" | "savings" | "wallet" | "credit";

export const ACCOUNT_TYPES: AccountType[] = [
  "checking",
  "savings",
  "wallet",
  "credit",
];

export interface AccountState extends EntityState {
  name: string;
  type: AccountType;
  institution?: string | null;
  initialBalance: number;
  userId: string;
}

export class Account extends Entity<AccountState> {
  constructor(props: AccountState) {
    super({
      ...props,
      initialBalance: props.initialBalance ?? 0,
    });
  }

  get name(): string {
    return this.props.name;
  }

  get type(): AccountType {
    return this.props.type;
  }

  get institution(): string | null | undefined {
    return this.props.institution;
  }

  get initialBalance(): number {
    return this.props.initialBalance;
  }

  get userId(): string {
    return this.props.userId;
  }

  public validate(): void {
    Validator.validate([
      {
        code: "account.name",
        value: this.name,
        rules: [new RequiredRule()],
      },
      {
        code: "account.type",
        value: this.type,
        rules: [new RequiredRule(), new InRule(ACCOUNT_TYPES)],
      },
      {
        code: "account.initialBalance",
        value: this.initialBalance,
        rules: [new RequiredRule(), new PrecisionRule(2)],
      },
      {
        code: "account.userId",
        value: this.userId,
        rules: [new RequiredRule(), new UuidRule()],
      },
    ]);
  }
}
