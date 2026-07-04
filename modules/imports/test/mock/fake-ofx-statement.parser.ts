import { OfxStatementParser, StatementRow } from "../../src";

export class FakeOfxStatementParser implements OfxStatementParser {
  constructor(private readonly rows: StatementRow[] = []) {}

  async parse(_content: string): Promise<StatementRow[]> {
    return this.rows;
  }
}
