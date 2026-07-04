export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Retorna o mes atual (`YYYY-MM`) no fuso UTC do servidor.
 */
export function currentMonth(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

/**
 * Converte um mes (`YYYY-MM`) no intervalo `[from, to]` (UTC) que cobre o
 * primeiro e o ultimo instante do mes.
 */
export function monthRange(month: string): { from: Date; to: Date } {
  const { year, monthNumber } = parseMonth(month);

  const from = new Date(Date.UTC(year, monthNumber - 1, 1, 0, 0, 0, 0));
  const to = new Date(Date.UTC(year, monthNumber, 0, 23, 59, 59, 999));

  return { from, to };
}

/**
 * Retorna os ultimos `count` meses (`YYYY-MM`), incluindo o mes atual,
 * ordenados do mais antigo para o mais recente.
 */
export function lastMonths(count: number): string[] {
  const now = new Date();
  const months: string[] = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
    );
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");

    months.push(`${year}-${month}`);
  }

  return months;
}

/**
 * Soma um numero de meses (positivo ou negativo) a um mes (`YYYY-MM`).
 */
export function addMonths(month: string, amount: number): string {
  const { year, monthNumber } = parseMonth(month);
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function parseMonth(month: string): { year: number; monthNumber: number } {
  const parts = month.split("-");
  const year = Number(parts[0]);
  const monthNumber = Number(parts[1]);

  return { year, monthNumber };
}
