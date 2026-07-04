export interface StatementRow {
  date: Date;
  description: string;
  amount: number;
}

/**
 * Resultado do parsing de um extrato: linhas normalizadas com sucesso e a
 * contagem de linhas de dados que nao puderam ser parseadas (nao sao
 * descartadas em silencio -- ver `design.md` da change 008-importacao-extratos).
 */
export interface StatementParseResult {
  rows: StatementRow[];
  invalidRows: number;
}

/**
 * Porta de parsing de extratos em CSV. Recebe o conteudo bruto do arquivo
 * (texto) e devolve as linhas normalizadas mais a contagem de linhas
 * invalidas. Linhas sem header resolvido ou com data/valor nao parseavel
 * sao contadas em `invalidRows` -- ver `design.md` da change
 * 008-importacao-extratos.
 */
export interface CsvStatementParser {
  parse(content: string): Promise<StatementParseResult>;
}

/**
 * Porta de parsing de extratos em OFX (SGML minimo). Recebe o conteudo bruto
 * do arquivo (texto) e devolve as linhas normalizadas mais a contagem de
 * linhas invalidas -- ver `design.md` da change 008-importacao-extratos.
 */
export interface OfxStatementParser {
  parse(content: string): Promise<StatementParseResult>;
}
