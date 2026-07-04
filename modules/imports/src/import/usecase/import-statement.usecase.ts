import { NotFoundError, UseCase, ValidationError } from "@meubolso/shared";
import { AccountRepository } from "@meubolso/accounts";
import { TransactionRepository, Transaction } from "@meubolso/transactions";
import { Import, ImportFormat, generateStatementFingerprint } from "../model";
import {
  CsvStatementParser,
  ImportRepository,
  OfxStatementParser,
} from "../provider";

export interface ImportStatementIn {
  userId: string;
  accountId: string;
  fileName: string;
  format: ImportFormat;
  content: string;
}

export interface ImportStatementOut {
  importId: string;
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
}

export class ImportStatement
  implements UseCase<ImportStatementIn, ImportStatementOut>
{
  constructor(
    private readonly importRepository: ImportRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly accountRepository: AccountRepository,
    private readonly csvStatementParser: CsvStatementParser,
    private readonly ofxStatementParser: OfxStatementParser,
  ) {}

  async execute(input: ImportStatementIn): Promise<ImportStatementOut> {
    const account = await this.accountRepository.findById(
      input.accountId,
      input.userId,
    );

    if (!account) {
      throw new NotFoundError("import.account.not.found");
    }

    const parser =
      input.format === "csv" ? this.csvStatementParser : this.ofxStatementParser;

    const rows = await parser.parse(input.content);

    if (rows.length === 0) {
      throw new ValidationError("import.file.empty");
    }

    const rowsWithFingerprint = rows.map((row) => ({
      ...row,
      fingerprint: generateStatementFingerprint({
        date: row.date,
        amount: row.amount,
        description: row.description,
      }),
    }));

    const existingFingerprints = await this.transactionRepository.findByFingerprints(
      input.userId,
      rowsWithFingerprint.map((row) => row.fingerprint),
    );
    const existingSet = new Set(existingFingerprints);

    const seenInThisFile = new Set<string>();
    const rowsToImport = [];
    let duplicateRows = 0;

    for (const row of rowsWithFingerprint) {
      if (existingSet.has(row.fingerprint) || seenInThisFile.has(row.fingerprint)) {
        duplicateRows += 1;
        continue;
      }

      seenInThisFile.add(row.fingerprint);
      rowsToImport.push(row);
    }

    let importEntity = new Import({
      fileName: input.fileName,
      format: input.format,
      status: "processing",
      accountId: input.accountId,
      totalRows: rows.length,
      importedRows: 0,
      duplicateRows,
      userId: input.userId,
    });

    importEntity.validate();
    importEntity = await this.importRepository.create(importEntity);

    for (const row of rowsToImport) {
      const type = row.amount < 0 ? "expense" : "income";
      const amount = Math.abs(row.amount);

      const transaction = new Transaction({
        date: row.date,
        description: row.description,
        type,
        amount,
        accountId: input.accountId,
        categoryId: undefined,
        source: "import",
        importId: importEntity.id,
        fingerprint: row.fingerprint,
        userId: input.userId,
      });

      transaction.validate();

      await this.transactionRepository.create(transaction);
    }

    const finishedImport = importEntity.clone({
      status: "done",
      importedRows: rowsToImport.length,
      duplicateRows,
    });

    await this.importRepository.update(finishedImport);

    return {
      importId: finishedImport.id,
      totalRows: rows.length,
      importedRows: rowsToImport.length,
      duplicateRows,
    };
  }
}
