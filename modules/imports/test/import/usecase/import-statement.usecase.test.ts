import { NotFoundError, ValidationError } from "@meubolso/shared";
import { Account } from "@meubolso/accounts";
import { Transaction } from "@meubolso/transactions";
import { CategorizationRule } from "@meubolso/categories";
import { ImportStatement } from "../../../src/import/usecase/import-statement.usecase";
import { generateStatementFingerprint } from "../../../src/import/model/statement-fingerprint.util";
import {
  FakeAccountRepository,
  FakeCategorizationRuleRepository,
  FakeCsvStatementParser,
  FakeImportRepository,
  FakeOfxStatementParser,
  FakeTransactionRepository,
} from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "99999999-9999-4999-8999-999999999999";
const ACCOUNT_ID = "22222222-2222-4222-8222-222222222222";
const TRANSPORT_CATEGORY_ID = "33333333-3333-4333-8333-333333333333";

function buildCategorizationRule(
  overrides: Partial<{ keyword: string; categoryId: string }> = {},
): CategorizationRule {
  return new CategorizationRule({
    keyword: overrides.keyword ?? "uber",
    categoryId: overrides.categoryId ?? TRANSPORT_CATEGORY_ID,
    priority: 0,
    userId: USER_ID,
  });
}

function buildAccount(overrides: Partial<{ userId: string }> = {}): Account {
  return new Account({
    id: ACCOUNT_ID,
    name: "Conta Corrente",
    type: "checking",
    initialBalance: 0,
    userId: overrides.userId ?? USER_ID,
  });
}

function buildUseCase(options: {
  accounts?: Account[];
  transactions?: Transaction[];
  csvRows?: { date: Date; description: string; amount: number }[];
  ofxRows?: { date: Date; description: string; amount: number }[];
  categorizationRules?: CategorizationRule[];
}) {
  const transactionRepository = new FakeTransactionRepository(
    options.transactions ?? [],
  );
  const importRepository = new FakeImportRepository(
    [],
    transactionRepository,
  );
  const accountRepository = new FakeAccountRepository(options.accounts ?? []);
  const csvParser = new FakeCsvStatementParser(options.csvRows ?? []);
  const ofxParser = new FakeOfxStatementParser(options.ofxRows ?? []);
  const categorizationRuleRepository = new FakeCategorizationRuleRepository(
    options.categorizationRules ?? [],
  );

  const useCase = new ImportStatement(
    importRepository,
    transactionRepository,
    accountRepository,
    csvParser,
    ofxParser,
    categorizationRuleRepository,
  );

  return {
    useCase,
    importRepository,
    transactionRepository,
    accountRepository,
    categorizationRuleRepository,
  };
}

describe("ImportStatement use case", () => {
  it("deve importar todas as linhas do CSV quando nao ha duplicatas", async () => {
    const { useCase, transactionRepository } = buildUseCase({
      accounts: [buildAccount()],
      csvRows: [
        {
          date: new Date("2026-06-01T00:00:00.000Z"),
          description: "Mercado Extra",
          amount: -150.32,
        },
        {
          date: new Date("2026-06-03T00:00:00.000Z"),
          description: "Salario",
          amount: 4500,
        },
      ],
    });

    const result = await useCase.execute({
      userId: USER_ID,
      accountId: ACCOUNT_ID,
      fileName: "extrato.csv",
      format: "csv",
      content: "irrelevante para o fake",
    });

    expect(result.totalRows).toBe(2);
    expect(result.importedRows).toBe(2);
    expect(result.duplicateRows).toBe(0);
    expect(transactionRepository.transactions).toHaveLength(2);

    const expenseTransaction = transactionRepository.transactions.find(
      (transaction) => transaction.description === "Mercado Extra",
    );
    expect(expenseTransaction?.type).toBe("expense");
    expect(expenseTransaction?.amount).toBe(150.32);
    expect(expenseTransaction?.source).toBe("import");
    expect(expenseTransaction?.importId).toBe(result.importId);
    expect(expenseTransaction?.categoryId).toBeUndefined();

    const incomeTransaction = transactionRepository.transactions.find(
      (transaction) => transaction.description === "Salario",
    );
    expect(incomeTransaction?.type).toBe("income");
    expect(incomeTransaction?.amount).toBe(4500);
  });

  it("deve importar todas as linhas do OFX quando nao ha duplicatas", async () => {
    const { useCase, transactionRepository } = buildUseCase({
      accounts: [buildAccount()],
      ofxRows: [
        {
          date: new Date("2026-06-01T00:00:00.000Z"),
          description: "Mercado Extra",
          amount: -150.32,
        },
      ],
    });

    const result = await useCase.execute({
      userId: USER_ID,
      accountId: ACCOUNT_ID,
      fileName: "extrato.ofx",
      format: "ofx",
      content: "irrelevante para o fake",
    });

    expect(result.totalRows).toBe(1);
    expect(result.importedRows).toBe(1);
    expect(result.duplicateRows).toBe(0);
    expect(transactionRepository.transactions).toHaveLength(1);
  });

  it("deve descartar linhas duplicadas (fingerprint ja existente) e nao criar transacao para elas", async () => {
    const existing = new Transaction({
      date: new Date("2026-06-01T00:00:00.000Z"),
      description: "Mercado Extra",
      type: "expense",
      amount: 150.32,
      accountId: ACCOUNT_ID,
      source: "import",
      fingerprint: "fingerprint-sera-recalculado-mas-testamos-via-execucao",
      userId: USER_ID,
    });

    const { useCase: firstRunUseCase, transactionRepository } = buildUseCase({
      accounts: [buildAccount()],
      csvRows: [
        {
          date: new Date("2026-06-01T00:00:00.000Z"),
          description: "Mercado Extra",
          amount: -150.32,
        },
      ],
    });

    const firstResult = await firstRunUseCase.execute({
      userId: USER_ID,
      accountId: ACCOUNT_ID,
      fileName: "extrato.csv",
      format: "csv",
      content: "irrelevante",
    });

    expect(firstResult.importedRows).toBe(1);
    expect(transactionRepository.transactions).toHaveLength(1);

    // Reimporta o mesmo arquivo usando o mesmo TransactionRepository (agora
    // ja populado) para simular a deduplicacao contra o historico.
    const { useCase: secondRunUseCase } = (() => {
      const importRepository = new FakeImportRepository(
        [],
        transactionRepository,
      );
      const accountRepository = new FakeAccountRepository([buildAccount()]);
      const csvParser = new FakeCsvStatementParser([
        {
          date: new Date("2026-06-01T00:00:00.000Z"),
          description: "Mercado Extra",
          amount: -150.32,
        },
      ]);
      const ofxParser = new FakeOfxStatementParser([]);
      const categorizationRuleRepository = new FakeCategorizationRuleRepository();

      return {
        useCase: new ImportStatement(
          importRepository,
          transactionRepository,
          accountRepository,
          csvParser,
          ofxParser,
          categorizationRuleRepository,
        ),
      };
    })();

    const secondResult = await secondRunUseCase.execute({
      userId: USER_ID,
      accountId: ACCOUNT_ID,
      fileName: "extrato.csv",
      format: "csv",
      content: "irrelevante",
    });

    expect(secondResult.totalRows).toBe(1);
    expect(secondResult.importedRows).toBe(0);
    expect(secondResult.duplicateRows).toBe(1);
    expect(transactionRepository.transactions).toHaveLength(1);
    void existing;
  });

  it("deve deduplicar tambem dentro do mesmo arquivo (duas linhas identicas no mesmo CSV)", async () => {
    const { useCase, transactionRepository } = buildUseCase({
      accounts: [buildAccount()],
      csvRows: [
        {
          date: new Date("2026-06-01T00:00:00.000Z"),
          description: "Mercado Extra",
          amount: -150.32,
        },
        {
          date: new Date("2026-06-01T00:00:00.000Z"),
          description: "Mercado Extra",
          amount: -150.32,
        },
      ],
    });

    const result = await useCase.execute({
      userId: USER_ID,
      accountId: ACCOUNT_ID,
      fileName: "extrato.csv",
      format: "csv",
      content: "irrelevante",
    });

    expect(result.totalRows).toBe(2);
    expect(result.importedRows).toBe(1);
    expect(result.duplicateRows).toBe(1);
    expect(transactionRepository.transactions).toHaveLength(1);
  });

  it("deve lancar NotFoundError quando a conta nao existe", async () => {
    const { useCase } = buildUseCase({
      accounts: [],
      csvRows: [
        {
          date: new Date("2026-06-01T00:00:00.000Z"),
          description: "Mercado Extra",
          amount: -150.32,
        },
      ],
    });

    await expect(
      useCase.execute({
        userId: USER_ID,
        accountId: ACCOUNT_ID,
        fileName: "extrato.csv",
        format: "csv",
        content: "irrelevante",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve lancar NotFoundError quando a conta pertence a outro usuario", async () => {
    const { useCase } = buildUseCase({
      accounts: [buildAccount({ userId: OTHER_USER_ID })],
      csvRows: [
        {
          date: new Date("2026-06-01T00:00:00.000Z"),
          description: "Mercado Extra",
          amount: -150.32,
        },
      ],
    });

    await expect(
      useCase.execute({
        userId: USER_ID,
        accountId: ACCOUNT_ID,
        fileName: "extrato.csv",
        format: "csv",
        content: "irrelevante",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("deve lancar ValidationError quando o arquivo nao possui linhas validas nem invalidas (vazio)", async () => {
    const { useCase } = buildUseCase({
      accounts: [buildAccount()],
      csvRows: [],
    });

    await expect(
      useCase.execute({
        userId: USER_ID,
        accountId: ACCOUNT_ID,
        fileName: "extrato.csv",
        format: "csv",
        content: "",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("deve computar invalidRows e manter totalRows = importedRows + duplicateRows + invalidRows", async () => {
    const transactionRepository = new FakeTransactionRepository([]);
    const importRepository = new FakeImportRepository(
      [],
      transactionRepository,
    );
    const accountRepository = new FakeAccountRepository([buildAccount()]);
    const csvParser = new FakeCsvStatementParser(
      [
        {
          date: new Date("2026-06-01T00:00:00.000Z"),
          description: "Mercado Extra",
          amount: -150.32,
        },
      ],
      3,
    );
    const ofxParser = new FakeOfxStatementParser([]);
    const categorizationRuleRepository = new FakeCategorizationRuleRepository();

    const useCase = new ImportStatement(
      importRepository,
      transactionRepository,
      accountRepository,
      csvParser,
      ofxParser,
      categorizationRuleRepository,
    );

    const result = await useCase.execute({
      userId: USER_ID,
      accountId: ACCOUNT_ID,
      fileName: "extrato.csv",
      format: "csv",
      content: "irrelevante",
    });

    expect(result.invalidRows).toBe(3);
    expect(result.importedRows).toBe(1);
    expect(result.duplicateRows).toBe(0);
    expect(result.totalRows).toBe(
      result.importedRows + result.duplicateRows + result.invalidRows,
    );

    const persisted = importRepository.imports.find(
      (item) => item.id === result.importId,
    );
    expect(persisted?.invalidRows).toBe(3);
  });

  it("deve categorizar automaticamente as transacoes criadas quando existe regra compativel (apply-rules ao final da importacao)", async () => {
    const { useCase, transactionRepository } = buildUseCase({
      accounts: [buildAccount()],
      csvRows: [
        {
          date: new Date("2026-06-01T00:00:00.000Z"),
          description: "UBER *TRIP",
          amount: -25.9,
        },
        {
          date: new Date("2026-06-02T00:00:00.000Z"),
          description: "Supermercado ABC",
          amount: -80,
        },
      ],
      categorizationRules: [buildCategorizationRule({ keyword: "uber" })],
    });

    const result = await useCase.execute({
      userId: USER_ID,
      accountId: ACCOUNT_ID,
      fileName: "extrato.csv",
      format: "csv",
      content: "irrelevante",
    });

    // Contrato de saida de import-statement permanece inalterado (invalidRows
    // e um campo aditivo).
    expect(result).toEqual({
      importId: result.importId,
      totalRows: 2,
      importedRows: 2,
      duplicateRows: 0,
      invalidRows: 0,
    });

    const uberTransaction = transactionRepository.transactions.find(
      (transaction) => transaction.description === "UBER *TRIP",
    );
    const marketTransaction = transactionRepository.transactions.find(
      (transaction) => transaction.description === "Supermercado ABC",
    );

    expect(uberTransaction?.categoryId).toBe(TRANSPORT_CATEGORY_ID);
    expect(marketTransaction?.categoryId).toBeUndefined();
  });

  it("nao deve chamar apply-rules quando nenhuma transacao foi criada (todas duplicadas)", async () => {
    const csvRows = [
      {
        date: new Date("2026-06-01T00:00:00.000Z"),
        description: "Mercado Extra",
        amount: -150.32,
      },
    ];

    const { useCase: firstRunUseCase, transactionRepository } = buildUseCase({
      accounts: [buildAccount()],
      csvRows,
      categorizationRules: [buildCategorizationRule({ keyword: "mercado" })],
    });

    await firstRunUseCase.execute({
      userId: USER_ID,
      accountId: ACCOUNT_ID,
      fileName: "extrato.csv",
      format: "csv",
      content: "irrelevante",
    });

    const categorizationRuleRepository = new FakeCategorizationRuleRepository([
      buildCategorizationRule({ keyword: "mercado" }),
    ]);
    const findAllByUserSpy = jest.spyOn(
      categorizationRuleRepository,
      "findAllByUser",
    );

    const secondRunUseCase = new ImportStatement(
      new FakeImportRepository([], transactionRepository),
      transactionRepository,
      new FakeAccountRepository([buildAccount()]),
      new FakeCsvStatementParser(csvRows),
      new FakeOfxStatementParser([]),
      categorizationRuleRepository,
    );

    const result = await secondRunUseCase.execute({
      userId: USER_ID,
      accountId: ACCOUNT_ID,
      fileName: "extrato.csv",
      format: "csv",
      content: "irrelevante",
    });

    expect(result.importedRows).toBe(0);
    expect(findAllByUserSpy).not.toHaveBeenCalled();
  });

  it("deve marcar o Import como failed (nao deixar em processing) quando a gravacao atomica falha (M6)", async () => {
    const transactionRepository = new FakeTransactionRepository([]);
    const importRepository = new FakeImportRepository(
      [],
      transactionRepository,
      new Error("falha simulada de conexao com o banco"),
    );
    const accountRepository = new FakeAccountRepository([buildAccount()]);
    const csvParser = new FakeCsvStatementParser([
      {
        date: new Date("2026-06-01T00:00:00.000Z"),
        description: "Mercado Extra",
        amount: -150.32,
      },
    ]);
    const ofxParser = new FakeOfxStatementParser([]);
    const categorizationRuleRepository = new FakeCategorizationRuleRepository();

    const useCase = new ImportStatement(
      importRepository,
      transactionRepository,
      accountRepository,
      csvParser,
      ofxParser,
      categorizationRuleRepository,
    );

    await expect(
      useCase.execute({
        userId: USER_ID,
        accountId: ACCOUNT_ID,
        fileName: "extrato.csv",
        format: "csv",
        content: "irrelevante",
      }),
    ).rejects.toThrow("falha simulada de conexao com o banco");

    expect(transactionRepository.transactions).toHaveLength(0);

    const persisted = importRepository.imports.find(
      (item) => item.accountId === ACCOUNT_ID,
    );
    expect(persisted?.status).toBe("failed");
  });

  it("deve tratar a violacao de unicidade por corrida (equivalente ao P2002) como duplicata (ConflictError), nao como erro 500, e marcar o Import como failed (M6)", async () => {
    const existing = new Transaction({
      date: new Date("2026-06-01T00:00:00.000Z"),
      description: "Mercado Extra",
      type: "expense",
      amount: 150.32,
      accountId: ACCOUNT_ID,
      source: "import",
      fingerprint: "fingerprint-gravado-por-outra-requisicao-concorrente",
      userId: USER_ID,
    });

    const transactionRepository = new FakeTransactionRepository([]);
    const importRepository = new FakeImportRepository(
      [],
      transactionRepository,
    );
    const accountRepository = new FakeAccountRepository([buildAccount()]);
    const csvParser = new FakeCsvStatementParser([
      {
        date: new Date("2026-06-01T00:00:00.000Z"),
        description: "Mercado Extra",
        amount: -150.32,
      },
    ]);
    const ofxParser = new FakeOfxStatementParser([]);
    const categorizationRuleRepository = new FakeCategorizationRuleRepository();

    const useCase = new ImportStatement(
      importRepository,
      transactionRepository,
      accountRepository,
      csvParser,
      ofxParser,
      categorizationRuleRepository,
    );

    // Simula a corrida: a checagem de duplicatas do caso de uso passa (nao ha
    // duplicata no momento da consulta), mas outra requisicao concorrente
    // grava a MESMA transacao antes da gravacao atomica desta -- o banco real
    // dispararia P2002; aqui simulamos gravando a transacao concorrente
    // diretamente no FakeTransactionRepository com o mesmo fingerprint que o
    // caso de uso vai calcular, fazendo `FakeImportRepository` lancar
    // ConflictError dentro de `createWithTransactions`.
    const csvRow = {
      date: new Date("2026-06-01T00:00:00.000Z"),
      description: "Mercado Extra",
      amount: -150.32,
    };

    const raceFingerprint = generateStatementFingerprint({
      date: csvRow.date,
      amount: csvRow.amount,
      accountId: ACCOUNT_ID,
      description: csvRow.description,
    });

    const originalFindByFingerprints =
      transactionRepository.findByFingerprints.bind(transactionRepository);
    let callCount = 0;
    transactionRepository.findByFingerprints = async (userId, fingerprints) => {
      callCount += 1;
      if (callCount === 1) {
        // Primeira checagem (dentro do caso de uso, antes de gravar): sem
        // duplicatas ainda.
        return originalFindByFingerprints(userId, fingerprints);
      }
      // Chamada feita pela FakeImportRepository dentro de
      // createWithTransactions: simula que a transacao concorrente ja foi
      // gravada por outra requisicao.
      return fingerprints.includes(raceFingerprint) ? [raceFingerprint] : [];
    };

    void existing;

    await expect(
      useCase.execute({
        userId: USER_ID,
        accountId: ACCOUNT_ID,
        fileName: "extrato.csv",
        format: "csv",
        content: "irrelevante",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });

    const persisted = importRepository.imports.find(
      (item) => item.accountId === ACCOUNT_ID,
    );
    expect(persisted?.status).toBe("failed");
  });
});
