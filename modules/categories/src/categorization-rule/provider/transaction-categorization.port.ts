/**
 * Representa o subconjunto de dados de uma transacao necessario para
 * `apply-rules`/`recategorize-all`. Definido localmente (em vez de importar
 * `@meubolso/transactions`) para evitar dependencia ciclica entre os modulos
 * `categories` (que precisa avaliar transacoes) e `transactions` (que ja
 * depende de `@meubolso/categories` para `CategoryRepository` em
 * `create-transaction`/`update-transaction`). Qualquer entidade `Transaction`
 * que exponha estes campos satisfaz este contrato estruturalmente.
 */
export interface CategorizableTransaction {
  readonly id: string;
  readonly description: string;
  readonly categoryId?: string | null;
  readonly userId: string;
  clone(data: { categoryId?: string | null }): CategorizableTransaction;
  validate(): void;
}

/**
 * Porta usada por `apply-rules`/`recategorize-all` para ler e persistir as
 * transacoes do usuario, sem depender do modulo `transactions` diretamente.
 * Implementada, no lado de infraestrutura (`apps/backend`), por um adapter
 * que delega para o `TransactionRepository` real de `@meubolso/transactions`.
 */
export interface TransactionCategorizationPort {
  findByIds(ids: string[], userId: string): Promise<CategorizableTransaction[]>;

  findAllWithoutCategory(userId: string): Promise<CategorizableTransaction[]>;

  findAllByUser(userId: string): Promise<CategorizableTransaction[]>;

  update(entity: CategorizableTransaction): Promise<CategorizableTransaction>;

  /**
   * Persiste todas as entidades informadas de forma ATOMICA (tudo ou nada):
   * a implementacao concreta deve rodar as atualizacoes dentro de uma unica
   * transacao de banco (`prisma.$transaction`), revertendo tudo se qualquer
   * atualizacao falhar. Usado por `recategorize-all` (auditoria M7) para
   * evitar estado parcial quando `includeAlreadyCategorized=true`: antes,
   * as transacoes eram zeradas uma a uma sem transacao de banco, entao uma
   * falha no meio deixava categorias apagadas para sempre.
   */
  updateMany(
    entities: CategorizableTransaction[],
  ): Promise<CategorizableTransaction[]>;
}
