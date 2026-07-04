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
}
