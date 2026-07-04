import { CsvStatementParser, StatementRow } from "../../src";

export class FakeCsvStatementParser implements CsvStatementParser {
  constructor(private readonly rows: StatementRow[] = []) {}

  async parse(_content: string): Promise<StatementRow[]> {
    return this.rows;
  }
}
