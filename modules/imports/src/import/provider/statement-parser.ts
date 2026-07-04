export interface StatementRow {
  date: Date;
  description: string;
  amount: number;
}

/**
 * Porta de parsing de extratos em CSV. Recebe o conteudo bruto do arquivo
 * (texto) e devolve as linhas normalizadas. Linhas sem header resolvido ou
 * com data/valor nao parseavel sao ignoradas (nao geram excecao) -- ver
 * `design.md` da change 008-importacao-extratos.
 */
export interface CsvStatementParser {
  parse(content: string): Promise<StatementRow[]>;
}

/**
 * Porta de parsing de extratos em OFX (SGML minimo). Recebe o conteudo bruto
 * do arquivo (texto) e devolve as linhas normalizadas -- ver `design.md` da
 * change 008-importacao-extratos.
 */
export interface OfxStatementParser {
  parse(content: string): Promise<StatementRow[]>;
}
