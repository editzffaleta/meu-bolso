import { CategorizationRule } from "../model";

export interface CategorizationRuleRepository {
  create(entity: CategorizationRule): Promise<CategorizationRule>;

  update(entity: CategorizationRule): Promise<CategorizationRule>;

  delete(id: string, userId: string): Promise<void>;

  /**
   * Busca uma regra pelo id, escopada ao usuario dono do registro.
   * Deve retornar `null` quando o id nao existir OU quando existir mas
   * pertencer a outro usuario (nunca deve vazar a existencia do registro).
   */
  findById(id: string, userId: string): Promise<CategorizationRule | null>;

  /**
   * Lista todas as regras do usuario informado, ordenadas por
   * `priority desc, createdAt asc` (desempate deterministico).
   */
  findAllByUser(userId: string): Promise<CategorizationRule[]>;
}
