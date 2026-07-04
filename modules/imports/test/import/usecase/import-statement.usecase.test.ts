import { NotFoundError, ValidationError } from "@meubolso/shared";
import { Account } from "@meubolso/accounts";
import { Transaction } from "@meubolso/transactions";
import { ImportStatement } from "../../../src/import/usecase/import-statement.usecase";
import {
  FakeAccountRepository,
  FakeCsvStatementParser,
  FakeImportRepository,
  FakeOfxStatementParser,
  FakeTransactionRepository,
} from "../../mock";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "99999999-9999-4999-8999-999999999999";
const ACCOUNT_ID = "22222222-2222-4222-8222-222222222222";

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
}) {
  const importRepository = new FakeImportRepository();
  const transactionRepository = new FakeTransactionRepository(
    options.transactions ?? [],
  );
  const accountRepository = new FakeAccountRepository(options.accounts ?? []);
  const csvParser = new FakeCsvStatementParser(options.csvRows ?? []);
  const ofxParser = new FakeOfxStatementParser(options.ofxRows ?? []);

  const useCase = new ImportStatement(
    importRepository,
    transactionRepository,
    accountRepository,
    csvParser,
    ofxParser,
  );

  return { useCase, importRepository, transactionRepository, accountRepository };
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
      const importRepository = new FakeImportRepository();
      const accountRepository = new FakeAccountRepository([buildAccount()]);
      const csvParser = new FakeCsvStatementParser([
        {
          date: new Date("2026-06-01T00:00:00.000Z"),
          description: "Mercado Extra",
          amount: -150.32,
        },
      ]);
      const ofxParser = new FakeOfxStatementParser([]);

      return {
        useCase: new ImportStatement(
          importRepository,
          transactionRepository,
          accountRepository,
          csvParser,
          ofxParser,
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

  it("deve lancar ValidationError quando o arquivo nao possui linhas validas", async () => {
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
});
