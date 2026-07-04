import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';
import {
  CreateAccount,
  CreateAccountIn,
} from '@meubolso/accounts';
import {
  CreateCategorizationRule,
  SeedDefaultCategories,
} from '@meubolso/categories';
import { CreateBudget } from '@meubolso/budgets';
import { CreateTransaction, generateFingerprint } from '@meubolso/transactions';

// Este é o seed de DEMONSTRAÇÃO — separado do seed técnico neutro
// (`prisma/seed/main.ts`, entregue na change 001), que não deve ser alterado.
// Objetivo: popular o dashboard com dados realistas para portfólio/demo local.

const DEMO_USER_EMAIL = 'demo@meubolso.app';
const DEMO_USER_NAME = 'Usuário Demo';
const BCRYPT_SALT_ROUNDS = 10;

const DATABASE_URL = process.env.DATABASE_URL ?? '';

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

interface AccountRaw {
  id: string;
  name: string;
  type: string;
  institution: string | null;
  initialBalance: { toNumber(): number } | number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// --- Repositórios mínimos ligados ao PrismaClient do próprio processo de seed ---
// Reaproveitam os mesmos contratos (ports) usados pela infraestrutura Nest, mas
// instanciados diretamente aqui porque o seed roda fora do container do Nest.

class SeedUserRepository {
  async create(user: {
    id: string;
    name: string;
    email: string;
    password: string;
  }) {
    return prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }
}

class SeedAccountRepository {
  async create(entity: {
    id: string;
    name: string;
    type: string;
    institution: string | null;
    initialBalance: number;
    userId: string;
  }) {
    const created = await prisma.account.create({
      data: {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        institution: entity.institution,
        initialBalance: entity.initialBalance,
        userId: entity.userId,
      },
    });

    return this.toDomain(created);
  }

  async update(entity: any) {
    const updated = await prisma.account.update({
      where: { id: entity.id, userId: entity.userId },
      data: {
        name: entity.name,
        type: entity.type,
        institution: entity.institution ?? null,
        initialBalance: entity.initialBalance,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string, userId: string) {
    await prisma.account.deleteMany({ where: { id, userId } });
  }

  async findById(id: string, userId: string) {
    const found = await prisma.account.findFirst({ where: { id, userId } });

    return found ? this.toDomain(found) : null;
  }

  async findAll(userId: string) {
    const found = await prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return found.map((item) => this.toDomain(item));
  }

  private toDomain(raw: AccountRaw) {
    const initialBalance =
      typeof raw.initialBalance === 'number'
        ? raw.initialBalance
        : raw.initialBalance.toNumber();

    return {
      id: raw.id,
      name: raw.name,
      type: raw.type,
      institution: raw.institution,
      initialBalance,
      userId: raw.userId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    } as any;
  }
}

class SeedCategoryRepository {
  async create(entity: {
    id: string;
    name: string;
    type: string;
    color: string;
    icon: string | null;
    isDefault: boolean;
    userId: string;
  }) {
    const created = await prisma.category.create({
      data: {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        color: entity.color,
        icon: entity.icon,
        isDefault: entity.isDefault,
        userId: entity.userId,
      },
    });

    return created as any;
  }

  async update(entity: any) {
    const updated = await prisma.category.update({
      where: { id: entity.id, userId: entity.userId },
      data: {
        name: entity.name,
        type: entity.type,
        color: entity.color,
        icon: entity.icon ?? null,
        isDefault: entity.isDefault,
      },
    });

    return updated as any;
  }

  async delete(id: string, userId: string) {
    await prisma.category.deleteMany({ where: { id, userId } });
  }

  async findById(id: string, userId: string) {
    return prisma.category.findFirst({ where: { id, userId } }) as any;
  }

  async findAll(userId: string) {
    return prisma.category.findMany({ where: { userId } }) as any;
  }

  async findByNames(names: string[], userId: string) {
    if (names.length === 0) {
      return [];
    }

    return prisma.category.findMany({
      where: {
        userId,
        OR: names.map((name) => ({
          name: { equals: name, mode: 'insensitive' as const },
        })),
      },
    }) as any;
  }
}

class SeedTransactionRepository {
  async create(entity: {
    id: string;
    date: Date;
    description: string;
    type: string;
    amount: number;
    accountId: string;
    categoryId: string | null;
    source: string;
    importId: string | null;
    fingerprint: string;
    userId: string;
  }) {
    const created = await prisma.transaction.create({
      data: {
        id: entity.id,
        date: entity.date,
        description: entity.description,
        type: entity.type,
        amount: entity.amount,
        accountId: entity.accountId,
        categoryId: entity.categoryId,
        source: entity.source,
        importId: entity.importId,
        fingerprint: entity.fingerprint,
        userId: entity.userId,
      },
    });

    return created as any;
  }

  async findById(id: string, userId: string) {
    return prisma.transaction.findFirst({ where: { id, userId } }) as any;
  }

  async findByFingerprints(userId: string, fingerprints: string[]) {
    if (fingerprints.length === 0) {
      return [];
    }

    const found = await prisma.transaction.findMany({
      where: { userId, fingerprint: { in: fingerprints } },
      select: { fingerprint: true },
    });

    return found.map((item) => item.fingerprint);
  }
}

class SeedCategorizationRuleRepository {
  async create(entity: {
    id: string;
    keyword: string;
    priority: number;
    categoryId: string;
    userId: string;
  }) {
    const created = await prisma.categorizationRule.create({
      data: {
        id: entity.id,
        keyword: entity.keyword,
        priority: entity.priority,
        categoryId: entity.categoryId,
        userId: entity.userId,
      },
    });

    return created as any;
  }

  async findAllByUser(userId: string) {
    return prisma.categorizationRule.findMany({ where: { userId } }) as any;
  }
}

class SeedBudgetRepository {
  async create(entity: {
    id: string;
    categoryId: string;
    month: string;
    limitAmount: number;
    userId: string;
  }) {
    const created = await prisma.budget.create({
      data: {
        id: entity.id,
        categoryId: entity.categoryId,
        month: entity.month,
        limitAmount: entity.limitAmount,
        userId: entity.userId,
      },
    });

    return created as any;
  }

  async findByCategoryAndMonth(userId: string, categoryId: string, month: string) {
    return prisma.budget.findFirst({ where: { userId, categoryId, month } }) as any;
  }

  async list(userId: string, month?: string) {
    return prisma.budget.findMany({
      where: { userId, ...(month ? { month } : {}) },
    }) as any;
  }
}

// --- Dados fixos de demonstração ---

interface DemoAccountDefinition {
  name: string;
  type: 'checking' | 'savings' | 'wallet';
  institution?: string;
  initialBalance: number;
}

const DEMO_ACCOUNTS: DemoAccountDefinition[] = [
  { name: 'Nubank', type: 'checking', institution: 'Nubank', initialBalance: 3200 },
  { name: 'Carteira', type: 'wallet', initialBalance: 150 },
  { name: 'Poupança', type: 'savings', institution: 'Banco do Brasil', initialBalance: 8000 },
];

const EXTRA_CATEGORIES: Array<{ name: string; type: 'income' | 'expense'; color: string }> = [
  { name: 'Contas', type: 'expense', color: '#DC2626' },
  { name: 'Alimentação', type: 'expense', color: '#F97316' },
];

interface ExpenseTemplate {
  description: string;
  categoryName: string;
  min: number;
  max: number;
  timesPerMonth: number;
}

const EXPENSE_TEMPLATES: ExpenseTemplate[] = [
  { description: 'Supermercado Extra', categoryName: 'Mercado', min: 180, max: 420, timesPerMonth: 4 },
  { description: 'Uber', categoryName: 'Transporte', min: 15, max: 45, timesPerMonth: 6 },
  { description: 'Aluguel', categoryName: 'Moradia', min: 1400, max: 1400, timesPerMonth: 1 },
  { description: 'Conta de luz', categoryName: 'Contas', min: 90, max: 180, timesPerMonth: 1 },
  { description: 'Conta de internet', categoryName: 'Contas', min: 99, max: 99, timesPerMonth: 1 },
  { description: 'iFood', categoryName: 'Alimentação', min: 35, max: 80, timesPerMonth: 5 },
  { description: 'Cinema', categoryName: 'Lazer', min: 40, max: 90, timesPerMonth: 1 },
  { description: 'Academia', categoryName: 'Saúde', min: 99, max: 99, timesPerMonth: 1 },
  { description: 'Farmácia', categoryName: 'Saúde', min: 30, max: 120, timesPerMonth: 2 },
  { description: 'Streaming', categoryName: 'Lazer', min: 25, max: 55, timesPerMonth: 1 },
];

const SALARY_TEMPLATE = {
  description: 'Salário mensal',
  categoryName: 'Salário',
  amount: 5200,
};

const RULE_DEFINITIONS: Array<{ keyword: string; categoryName: string; priority: number }> = [
  { keyword: 'uber', categoryName: 'Transporte', priority: 10 },
  { keyword: 'ifood', categoryName: 'Alimentação', priority: 10 },
  { keyword: 'supermercado', categoryName: 'Mercado', priority: 5 },
  { keyword: 'farmácia', categoryName: 'Saúde', priority: 5 },
  { keyword: 'aluguel', categoryName: 'Moradia', priority: 5 },
];

// Gerador determinístico simples (sem dependências externas) para variação de
// valores/datas por mês, mantendo os dados coerentes entre execuções.
function seededRandom(seed: number): () => number {
  let value = seed;

  return () => {
    value = (value * 9301 + 49297) % 233280;

    return value / 233280;
  };
}

function toMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');

  return `${year}-${month}`;
}

async function main() {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is required to run prisma/seed/demo.ts');
  }

  const demoPassword = process.env.SEED_DEMO_PASSWORD;

  if (!demoPassword) {
    throw new Error(
      'SEED_DEMO_PASSWORD é obrigatória para rodar o seed de demonstração. ' +
        'Defina-a no .env (veja .env.example) antes de executar "npm run seed:demo".',
    );
  }

  const userRepository = new SeedUserRepository();
  const accountRepository = new SeedAccountRepository();
  const categoryRepository = new SeedCategoryRepository();
  const transactionRepository = new SeedTransactionRepository();
  const categorizationRuleRepository = new SeedCategorizationRuleRepository();
  const budgetRepository = new SeedBudgetRepository();

  // 1) Usuário demo (idempotente: busca por e-mail antes de criar).
  let demoUser = await userRepository.findByEmail(DEMO_USER_EMAIL);

  if (!demoUser) {
    const hashedPassword = await hash(demoPassword, BCRYPT_SALT_ROUNDS);

    demoUser = await userRepository.create({
      id: crypto.randomUUID(),
      name: DEMO_USER_NAME,
      email: DEMO_USER_EMAIL,
      password: hashedPassword,
    });

    console.log(`[seed:demo] Usuário demo criado: ${DEMO_USER_EMAIL}`);
  } else {
    console.log(`[seed:demo] Usuário demo já existia: ${DEMO_USER_EMAIL}`);
  }

  const userId = demoUser.id;

  // 2) Contas (idempotente por nome).
  const createAccount = new CreateAccount(accountRepository as any);
  const existingAccounts = await accountRepository.findAll(userId);
  const existingAccountNames = new Set(
    existingAccounts.map((account: any) => account.name.toLowerCase()),
  );

  const accountsByName = new Map<string, any>(
    existingAccounts.map((account: any) => [account.name.toLowerCase(), account]),
  );

  for (const definition of DEMO_ACCOUNTS) {
    if (existingAccountNames.has(definition.name.toLowerCase())) {
      continue;
    }

    const input: CreateAccountIn = {
      name: definition.name,
      type: definition.type,
      institution: definition.institution,
      initialBalance: definition.initialBalance,
      userId,
    };

    const created = await createAccount.execute(input);
    accountsByName.set(definition.name.toLowerCase(), created);
  }

  console.log(`[seed:demo] Contas disponíveis: ${accountsByName.size}`);

  const primaryAccount = accountsByName.get('nubank');

  if (!primaryAccount) {
    throw new Error('[seed:demo] Falha ao localizar conta principal "Nubank" após seed.');
  }

  // 3) Categorias padrão + extras específicas da demo.
  const seedDefaultCategories = new SeedDefaultCategories(categoryRepository as any);
  const defaultResult = await seedDefaultCategories.execute({ userId });

  const categoriesByName = new Map<string, any>(
    defaultResult.categories.map((category: any) => [category.name.toLowerCase(), category]),
  );

  const existingExtra = await categoryRepository.findByNames(
    EXTRA_CATEGORIES.map((item) => item.name),
    userId,
  );

  for (const category of existingExtra) {
    categoriesByName.set(category.name.toLowerCase(), category);
  }

  for (const definition of EXTRA_CATEGORIES) {
    if (categoriesByName.has(definition.name.toLowerCase())) {
      continue;
    }

    const created = await categoryRepository.create({
      id: crypto.randomUUID(),
      name: definition.name,
      type: definition.type,
      color: definition.color,
      icon: null,
      isDefault: false,
      userId,
    });

    categoriesByName.set(definition.name.toLowerCase(), created);
  }

  console.log(`[seed:demo] Categorias disponíveis: ${categoriesByName.size}`);

  // 4) Transações: ~6 meses retroativos, receita mensal + despesas variadas.
  const createTransaction = new CreateTransaction(
    transactionRepository as any,
    accountRepository as any,
    categoryRepository as any,
  );

  const now = new Date();
  const monthsBack = 6;
  let transactionsCreated = 0;
  let transactionsSkipped = 0;

  const salaryCategory = categoriesByName.get(SALARY_TEMPLATE.categoryName.toLowerCase());

  for (let offset = 0; offset < monthsBack; offset += 1) {
    const monthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    const monthSeed = monthDate.getUTCFullYear() * 100 + (monthDate.getUTCMonth() + 1);
    const random = seededRandom(monthSeed);

    // Receita: salário no dia 5 de cada mês.
    const salaryDate = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 5));
    const salaryFingerprint = generateFingerprint({
      userId,
      accountId: primaryAccount.id,
      date: salaryDate,
      amount: SALARY_TEMPLATE.amount,
      type: 'income',
      description: SALARY_TEMPLATE.description,
    });

    const salaryExisting = await transactionRepository.findByFingerprints(userId, [
      salaryFingerprint,
    ]);

    if (salaryExisting.length === 0) {
      await createTransaction.execute({
        date: salaryDate,
        description: SALARY_TEMPLATE.description,
        type: 'income',
        amount: SALARY_TEMPLATE.amount,
        accountId: primaryAccount.id,
        categoryId: salaryCategory?.id,
        userId,
      });
      transactionsCreated += 1;
    } else {
      transactionsSkipped += 1;
    }

    // Despesas: várias por template, distribuídas no mês.
    for (const template of EXPENSE_TEMPLATES) {
      const category = categoriesByName.get(template.categoryName.toLowerCase());

      for (let occurrence = 0; occurrence < template.timesPerMonth; occurrence += 1) {
        const day = 1 + Math.floor(random() * 27);
        const amount =
          template.min === template.max
            ? template.min
            : Math.round((template.min + random() * (template.max - template.min)) * 100) / 100;

        const date = new Date(
          Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), day),
        );

        const fingerprint = generateFingerprint({
          userId,
          accountId: primaryAccount.id,
          date,
          amount,
          type: 'expense',
          description: `${template.description} #${occurrence + 1}`,
        });

        const existingByFingerprint = await transactionRepository.findByFingerprints(userId, [
          fingerprint,
        ]);

        if (existingByFingerprint.length > 0) {
          transactionsSkipped += 1;
          continue;
        }

        await createTransaction.execute({
          date,
          description: `${template.description} #${occurrence + 1}`,
          type: 'expense',
          amount,
          accountId: primaryAccount.id,
          categoryId: category?.id,
          userId,
        });
        transactionsCreated += 1;
      }
    }
  }

  console.log(
    `[seed:demo] Transações criadas: ${transactionsCreated} · já existentes (puladas): ${transactionsSkipped}`,
  );

  // 5) Regras de categorização.
  const createCategorizationRule = new CreateCategorizationRule(
    categorizationRuleRepository as any,
    categoryRepository as any,
  );

  const existingRules = await categorizationRuleRepository.findAllByUser(userId);
  const existingRuleKeywords = new Set(
    existingRules.map((rule: any) => rule.keyword.toLowerCase()),
  );

  let rulesCreated = 0;

  for (const definition of RULE_DEFINITIONS) {
    if (existingRuleKeywords.has(definition.keyword.toLowerCase())) {
      continue;
    }

    const category = categoriesByName.get(definition.categoryName.toLowerCase());

    if (!category) {
      continue;
    }

    await createCategorizationRule.execute({
      keyword: definition.keyword,
      categoryId: category.id,
      priority: definition.priority,
      userId,
    });
    rulesCreated += 1;
  }

  console.log(`[seed:demo] Regras de categorização criadas: ${rulesCreated}`);

  // 6) Orçamentos do mês corrente: verde, amarelo e vermelho.
  const createBudget = new CreateBudget(budgetRepository as any, categoryRepository as any);
  const currentMonth = toMonthKey(now);

  const budgetDefinitions = [
    // Mercado: gasto real do mês (4 compras * média ~300) fica bem abaixo do limite -> verde.
    { categoryName: 'Mercado', limitAmount: 2500 },
    // Transporte: gasto real (6 * ~30) próximo do limite -> amarelo/limite justo.
    { categoryName: 'Transporte', limitAmount: 180 },
    // Lazer: gasto real (cinema + streaming) ultrapassa limite baixo -> vermelho.
    { categoryName: 'Lazer', limitAmount: 50 },
  ];

  let budgetsCreated = 0;

  for (const definition of budgetDefinitions) {
    const category = categoriesByName.get(definition.categoryName.toLowerCase());

    if (!category) {
      continue;
    }

    const existingBudget = await budgetRepository.findByCategoryAndMonth(
      userId,
      category.id,
      currentMonth,
    );

    if (existingBudget) {
      continue;
    }

    await createBudget.execute({
      categoryId: category.id,
      month: currentMonth,
      limitAmount: definition.limitAmount,
      userId,
    });
    budgetsCreated += 1;
  }

  console.log(`[seed:demo] Orçamentos criados para ${currentMonth}: ${budgetsCreated}`);
  console.log('[seed:demo] Concluído.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
