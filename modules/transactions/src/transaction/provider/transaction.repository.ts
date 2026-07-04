import { Transaction, TransactionType } from "../model";

export interface TransactionFilters {
  from?: Date;
  to?: Date;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
}

export interface TransactionListResult {
  items: Transaction[];
  total: number;
}

export interface TransactionRepository {
  create(entity: Transaction): Promise<Transaction>;

  update(entity: Transaction): Promise<Transaction>;

  delete(id: string, userId: string): Promise<void>;

  /**
   * Busca uma transacao pelo id, escopada ao usuario dono do registro.
   * Deve retornar `null` quando o id nao existir OU quando existir mas
   * pertencer a outro usuario (nunca deve vazar a existencia do registro).
   */
  findById(id: string, userId: string): Promise<Transaction | null>;

  /**
   * Lista transacoes do usuario informado aplicando os filtros opcionais
   * e paginacao (`page` comeca em 1). Retorna o total sem paginacao para
   * suportar a UI de paginacao.
   */
  findMany(
    filters: TransactionFilters,
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<TransactionListResult>;

  /**
   * Busca, entre as transacoes do usuario, quais dos fingerprints informados
   * ja existem (usado pela importacao de extratos - 008 - para deduplicar
   * linhas de um arquivo contra transacoes ja persistidas). Retorna apenas os
   * fingerprints encontrados.
   */
  findByFingerprints(userId: string, fingerprints: string[]): Promise<string[]>;

  /**
   * Busca transacoes do usuario pelos ids informados (usado pela
   * categorizacao automatica - 009 - para avaliar um conjunto especifico
   * de transacoes recem-criadas por uma importacao).
   */
  findByIds(ids: string[], userId: string): Promise<Transaction[]>;

  /**
   * Lista todas as transacoes do usuario que ainda nao possuem `categoryId`
   * (usado pela categorizacao automatica - 009 - para recategorizar em
   * massa quando nenhum `transactionIds` explicito e informado).
   */
  findAllWithoutCategory(userId: string): Promise<Transaction[]>;

  /**
   * Lista todas as transacoes do usuario, categorizadas ou nao (usado pela
   * recategorizacao em massa - 009 - com `includeAlreadyCategorized=true`).
   */
  findAllByUser(userId: string): Promise<Transaction[]>;

  /**
   * Soma, escopado ao usuario, o total de receitas (`type=income`) e
   * despesas (`type=expense`) e a contagem de transacoes cuja `date` esteja
   * entre `from` e `to` (inclusive). Usado pelo dashboard (`011`) para o
   * card de resumo do periodo.
   */
  sumByType(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<TransactionTypeSummary>;

  /**
   * Soma, escopado ao usuario, o total de despesas (`type=expense`) por
   * `categoryId` cuja `date` esteja entre `from` e `to` (inclusive).
   * Transacoes sem `categoryId` sao agrupadas com `categoryId=null`. Usado
   * pelo dashboard (`011`) para o grafico de pizza por categoria.
   */
  sumByCategory(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<CategorySpendingSummary[]>;

  /**
   * Soma, escopado ao usuario, o total de receitas e despesas por mes
   * (`YYYY-MM`) cuja `date` esteja entre `from` e `to` (inclusive). Usado
   * pelo dashboard (`011`) para o grafico de evolucao mensal. Meses sem
   * nenhuma transacao nao aparecem no resultado (o chamador preenche os
   * meses ausentes com zero).
   */
  sumByMonth(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<MonthlyTransactionSummary[]>;
}

export interface TransactionTypeSummary {
  income: number;
  expense: number;
  count: number;
}

export interface CategorySpendingSummary {
  categoryId: string | null;
  total: number;
}

export interface MonthlyTransactionSummary {
  month: string;
  income: number;
  expense: number;
}
