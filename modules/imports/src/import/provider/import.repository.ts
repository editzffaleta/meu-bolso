import { Import } from "../model";

export interface ImportListResult {
  items: Import[];
  total: number;
}

export interface ImportRepository {
  create(entity: Import): Promise<Import>;

  update(entity: Import): Promise<Import>;

  /**
   * Lista o historico de importacoes do usuario informado, ordenado por
   * createdAt desc (`page` comeca em 1).
   */
  findPage(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<ImportListResult>;
}
