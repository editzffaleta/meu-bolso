import {
  OfxStatementParser,
  StatementParseResult,
  StatementRow,
} from "../../src";

export class FakeOfxStatementParser implements OfxStatementParser {
  constructor(
    private readonly rows: StatementRow[] = [],
    private readonly invalidRows: number = 0,
  ) {}

  async parse(_content: string): Promise<StatementParseResult> {
    return { rows: this.rows, invalidRows: this.invalidRows };
  }
}
