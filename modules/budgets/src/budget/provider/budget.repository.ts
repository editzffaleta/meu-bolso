import { Budget } from "../model";

export interface BudgetRepository {
  create(entity: Budget): Promise<Budget>;

  update(entity: Budget): Promise<Budget>;

  delete(id: string, userId: string): Promise<void>;

  /**
   * Busca um orcamento pelo id, escopado ao usuario dono do registro.
   * Deve retornar `null` quando o id nao existir OU quando existir mas
   * pertencer a outro usuario (nunca deve vazar a existencia do registro).
   */
  findById(id: string, userId: string): Promise<Budget | null>;

  /**
   * Busca um orcamento pelo trio (userId, categoryId, month), usado para
   * garantir a unicidade antes de criar um novo orcamento.
   */
  findByCategoryAndMonth(
    userId: string,
    categoryId: string,
    month: string,
  ): Promise<Budget | null>;

  /**
   * Lista os orcamentos do usuario, com filtro opcional por mes.
   */
  list(userId: string, month?: string): Promise<Budget[]>;

  /**
   * Soma o total de transacoes `type=expense` da categoria informada,
   * dentro do mes informado (formato `YYYY-MM`), escopado ao usuario.
   * Deve ser implementado via `aggregate`/`groupBy` (sem carregar todas as
   * linhas em memoria).
   */
  sumSpentByCategory(
    userId: string,
    categoryId: string,
    month: string,
  ): Promise<number>;
}
