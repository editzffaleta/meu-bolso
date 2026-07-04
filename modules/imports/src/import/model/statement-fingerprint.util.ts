import { createHash } from "node:crypto";

export interface StatementFingerprintInput {
  date: Date;
  amount: number;
  accountId: string;
  description: string;
}

/**
 * Gera o fingerprint de uma linha de extrato (CSV/OFX) conforme o `design.md`
 * da change 008-importacao-extratos, com o ajuste da auditoria M5:
 * `sha256(normalizedDate + '|' + normalizedAmount + '|' + accountId + '|' + normalizedDescription)`.
 * - `normalizedDate`: `YYYY-MM-DD`.
 * - `normalizedAmount`: valor **com sinal** (nao mais `Math.abs`), com 2 casas
 *   decimais, como string. Sem o sinal, uma compra e o respectivo estorno no
 *   mesmo dia/descricao (+100 e -100) colidiam no mesmo fingerprint e o
 *   estorno era descartado como duplicata.
 * - `accountId`: incluido para que o mesmo extrato importado em contas
 *   diferentes nao seja tratado como duplicata.
 * - `normalizedDescription`: trim + lowercase, sem acentos.
 */
export function generateStatementFingerprint(
  input: StatementFingerprintInput,
): string {
  const normalizedDate = input.date.toISOString().slice(0, 10);
  const normalizedAmount = input.amount.toFixed(2);
  const normalizedDescription = input.description
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const raw = [
    normalizedDate,
    normalizedAmount,
    input.accountId,
    normalizedDescription,
  ].join("|");

  return createHash("sha256").update(raw).digest("hex");
}
