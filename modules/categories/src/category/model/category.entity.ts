import {
  Entity,
  EntityState,
  InRule,
  RegexRule,
  RequiredRule,
  UuidRule,
  Validator,
} from "@meubolso/shared";

export type CategoryType = "expense" | "income";

export const CATEGORY_TYPES: CategoryType[] = ["expense", "income"];

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

export interface CategoryState extends EntityState {
  name: string;
  type: CategoryType;
  color: string;
  icon?: string | null;
  userId: string;
  isDefault: boolean;
}

export class Category extends Entity<CategoryState> {
  constructor(props: CategoryState) {
    super({
      ...props,
      isDefault: props.isDefault ?? false,
    });
  }

  get name(): string {
    return this.props.name;
  }

  get type(): CategoryType {
    return this.props.type;
  }

  get color(): string {
    return this.props.color;
  }

  get icon(): string | null | undefined {
    return this.props.icon;
  }

  get userId(): string {
    return this.props.userId;
  }

  get isDefault(): boolean {
    return this.props.isDefault;
  }

  public validate(): void {
    Validator.validate([
      {
        code: "category.name",
        value: this.name,
        rules: [new RequiredRule()],
      },
      {
        code: "category.type",
        value: this.type,
        rules: [new RequiredRule(), new InRule(CATEGORY_TYPES)],
      },
      {
        code: "category.color",
        value: this.color,
        rules: [new RequiredRule(), new RegexRule(HEX_COLOR_PATTERN)],
      },
      {
        code: "category.userId",
        value: this.userId,
        rules: [new RequiredRule(), new UuidRule()],
      },
    ]);
  }
}
