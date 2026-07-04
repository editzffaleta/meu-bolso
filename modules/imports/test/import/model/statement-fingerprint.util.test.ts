import { generateStatementFingerprint } from "../../../src/import/model/statement-fingerprint.util";

const ACCOUNT_ID = "22222222-2222-4222-8222-222222222222";
const OTHER_ACCOUNT_ID = "33333333-3333-4333-8333-333333333333";

describe("generateStatementFingerprint (M5 da auditoria)", () => {
  it("deve gerar fingerprints diferentes para a MESMA linha importada em contas diferentes", () => {
    const base = {
      date: new Date("2026-06-01T00:00:00.000Z"),
      amount: -150.32,
      description: "Mercado Extra",
    };

    const fingerprintAccountA = generateStatementFingerprint({
      ...base,
      accountId: ACCOUNT_ID,
    });
    const fingerprintAccountB = generateStatementFingerprint({
      ...base,
      accountId: OTHER_ACCOUNT_ID,
    });

    expect(fingerprintAccountA).not.toBe(fingerprintAccountB);
  });

  it("deve gerar fingerprints diferentes para uma compra e o respectivo estorno (mesmo dia/descricao, valor com sinal oposto)", () => {
    const purchase = generateStatementFingerprint({
      date: new Date("2026-06-01T00:00:00.000Z"),
      amount: -100,
      accountId: ACCOUNT_ID,
      description: "Loja X",
    });
    const refund = generateStatementFingerprint({
      date: new Date("2026-06-01T00:00:00.000Z"),
      amount: 100,
      accountId: ACCOUNT_ID,
      description: "Loja X",
    });

    expect(purchase).not.toBe(refund);
  });

  it("deve gerar o mesmo fingerprint para a mesma linha (mesma conta, valor e sinal)", () => {
    const input = {
      date: new Date("2026-06-01T00:00:00.000Z"),
      amount: -150.32,
      accountId: ACCOUNT_ID,
      description: "Mercado Extra",
    };

    expect(generateStatementFingerprint(input)).toBe(
      generateStatementFingerprint({ ...input }),
    );
  });
});
