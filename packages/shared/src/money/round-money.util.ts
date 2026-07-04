/**
 * Arredonda um valor monetario para 2 casas decimais em um UNICO ponto,
 * evitando que erros de ponto flutuante acumulados em somas (ex.: 0.1 + 0.2)
 * vazem para a resposta exposta ao cliente.
 *
 * Uso: aplicar apenas no ponto de EXPOSICAO do valor (ex.: ao montar o
 * DTO/response de um use case), nunca em somas intermediarias -- as somas
 * devem ser feitas no banco (via `aggregate`/`groupBy` com Decimal) para nao
 * acumular erro; este helper so cuida do arredondamento final de exibicao.
 */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
