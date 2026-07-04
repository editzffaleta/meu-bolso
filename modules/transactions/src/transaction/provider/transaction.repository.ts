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
}
