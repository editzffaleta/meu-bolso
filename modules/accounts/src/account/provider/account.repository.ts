import { Account } from "../model";

export interface AccountRepository {
  create(entity: Account): Promise<Account>;

  update(entity: Account): Promise<Account>;

  delete(id: string, userId: string): Promise<void>;

  /**
   * Busca uma conta pelo id, escopada ao usuario dono do registro.
   * Deve retornar `null` quando o id nao existir OU quando existir mas
   * pertencer a outro usuario (nunca deve vazar a existencia do registro).
   */
  findById(id: string, userId: string): Promise<Account | null>;

  /**
   * Lista todas as contas pertencentes ao usuario informado.
   */
  findAll(userId: string): Promise<Account[]>;

  /**
   * Soma, no banco, o `initialBalance` de todas as contas do usuario
   * informado. Usado pelo saldo consolidado real (auditoria M10).
   */
  sumInitialBalance(userId: string): Promise<number>;
}
