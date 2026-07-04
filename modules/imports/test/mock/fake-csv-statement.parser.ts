import {
  CsvStatementParser,
  StatementParseResult,
  StatementRow,
} from "../../src";

export class FakeCsvStatementParser implements CsvStatementParser {
  constructor(
    private readonly rows: StatementRow[] = [],
    private readonly invalidRows: number = 0,
  ) {}

  async parse(_content: string): Promise<StatementParseResult> {
    return { rows: this.rows, invalidRows: this.invalidRows };
  }
}
