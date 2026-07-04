import { createHash } from "node:crypto";

export interface StatementFingerprintInput {
  date: Date;
  amount: number;
  description: string;
}

/**
 * Gera o fingerprint de uma linha de extrato (CSV/OFX) conforme o `design.md`
 * da change 008-importacao-extratos:
 * `sha256(normalizedDate + '|' + normalizedAmount + '|' + normalizedDescription)`.
 * - `normalizedDate`: `YYYY-MM-DD`.
 * - `normalizedAmount`: valor absoluto com 2 casas decimais, como string.
 * - `normalizedDescription`: trim + lowercase, sem acentos.
 */
export function generateStatementFingerprint(
  input: StatementFingerprintInput,
): string {
  const normalizedDate = input.date.toISOString().slice(0, 10);
  const normalizedAmount = Math.abs(input.amount).toFixed(2);
  const normalizedDescription = input.description
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const raw = [normalizedDate, normalizedAmount, normalizedDescription].join(
    "|",
  );

  return createHash("sha256").update(raw).digest("hex");
}
