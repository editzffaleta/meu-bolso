import { createHash } from "node:crypto";

export interface FingerprintInput {
  userId: string;
  accountId: string;
  date: Date;
  amount: number;
  type: string;
  description: string;
}

/**
 * Gera um hash determinístico (SHA-256) a partir dos dados que identificam
 * uma transação, usado para deduplicação (índice único `(userId, fingerprint)`).
 * Reaproveitado pela importação de extratos (008) com os dados do extrato.
 */
export function generateFingerprint(input: FingerprintInput): string {
  const raw = [
    input.userId,
    input.accountId,
    input.date.toISOString(),
    input.amount.toFixed(2),
    input.type,
    input.description.trim().toLowerCase(),
  ].join("|");

  return createHash("sha256").update(raw).digest("hex");
}
