import { Category } from "../model";

export interface CategoryRepository {
  create(entity: Category): Promise<Category>;

  update(entity: Category): Promise<Category>;

  delete(id: string, userId: string): Promise<void>;

  /**
   * Busca uma categoria pelo id, escopada ao usuario dono do registro.
   * Deve retornar `null` quando o id nao existir OU quando existir mas
   * pertencer a outro usuario (nunca deve vazar a existencia do registro).
   */
  findById(id: string, userId: string): Promise<Category | null>;

  /**
   * Lista todas as categorias pertencentes ao usuario informado.
   */
  findAll(userId: string): Promise<Category[]>;

  /**
   * Busca categorias do usuario cujo `name` coincide (comparacao
   * case-insensitive) com algum dos nomes informados. Usado pelo
   * `seed-default-categories` para descobrir quais categorias padrao
   * ja existem antes de criar as ausentes.
   */
  findByNames(names: string[], userId: string): Promise<Category[]>;
}
