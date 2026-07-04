export type CategorizationRule = {
  id: string;
  keyword: string;
  categoryId: string;
  priority: number;
};

export type CategorizationRuleFormValues = {
  keyword: string;
  categoryId: string;
  priority: string;
};

export type RecategorizeResult = {
  evaluated: number;
  categorized: number;
};
