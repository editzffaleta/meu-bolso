import {
  DateRule,
  Entity,
  EntityState,
  InRule,
  PositiveRule,
  RequiredRule,
  UuidRule,
  Validator,
} from "@meubolso/shared";

export type TransactionType = "income" | "expense";

export const TRANSACTION_TYPES: TransactionType[] = ["income", "expense"];

export type TransactionSource = "manual" | "import";

export const TRANSACTION_SOURCES: TransactionSource[] = ["manual", "import"];

export interface TransactionState extends EntityState {
  date: Date;
  description: string;
  type: TransactionType;
  amount: number;
  accountId: string;
  categoryId?: string | null;
  source: TransactionSource;
  importId?: string | null;
  fingerprint: string;
  userId: string;
}

export class Transaction extends Entity<TransactionState> {
  constructor(props: TransactionState) {
    super({
      ...props,
      source: props.source ?? "manual",
    });
  }

  get date(): Date {
    return this.props.date;
  }

  get description(): string {
    return this.props.description;
  }

  get type(): TransactionType {
    return this.props.type;
  }

  get amount(): number {
    return this.props.amount;
  }

  get accountId(): string {
    return this.props.accountId;
  }

  get categoryId(): string | null | undefined {
    return this.props.categoryId;
  }

  get source(): TransactionSource {
    return this.props.source;
  }

  get importId(): string | null | undefined {
    return this.props.importId;
  }

  get fingerprint(): string {
    return this.props.fingerprint;
  }

  get userId(): string {
    return this.props.userId;
  }

  public validate(): void {
    Validator.validate([
      {
        code: "transaction.date",
        value: this.date,
        rules: [new RequiredRule(), new DateRule()],
      },
      {
        code: "transaction.description",
        value: this.description,
        rules: [new RequiredRule()],
      },
      {
        code: "transaction.type",
        value: this.type,
        rules: [new RequiredRule(), new InRule(TRANSACTION_TYPES)],
      },
      {
        code: "transaction.amount",
        value: this.amount,
        rules: [new RequiredRule(), new PositiveRule()],
      },
      {
        code: "transaction.accountId",
        value: this.accountId,
        rules: [new RequiredRule(), new UuidRule()],
      },
      {
        code: "transaction.categoryId",
        value: this.categoryId,
        rules: [new UuidRule()],
      },
      {
        code: "transaction.source",
        value: this.source,
        rules: [new RequiredRule(), new InRule(TRANSACTION_SOURCES)],
      },
      {
        code: "transaction.fingerprint",
        value: this.fingerprint,
        rules: [new RequiredRule()],
      },
      {
        code: "transaction.userId",
        value: this.userId,
        rules: [new RequiredRule(), new UuidRule()],
      },
    ]);
  }
}
