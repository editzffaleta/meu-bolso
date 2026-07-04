import { generateFingerprint } from "../../../src/transaction/model/fingerprint.util";

const BASE_INPUT = {
  userId: "11111111-1111-4111-8111-111111111111",
  accountId: "22222222-2222-4222-8222-222222222222",
  date: new Date("2026-01-10T00:00:00.000Z"),
  amount: 150.5,
  type: "expense",
  description: "Mercado",
};

describe("generateFingerprint", () => {
  it("deve gerar o mesmo hash para os mesmos dados", () => {
    const first = generateFingerprint(BASE_INPUT);
    const second = generateFingerprint({ ...BASE_INPUT });

    expect(first).toBe(second);
    expect(first).toHaveLength(64);
  });

  it("deve gerar hashes diferentes quando o amount muda", () => {
    const first = generateFingerprint(BASE_INPUT);
    const second = generateFingerprint({ ...BASE_INPUT, amount: 200 });

    expect(first).not.toBe(second);
  });

  it("deve gerar hashes diferentes quando o type muda", () => {
    const first = generateFingerprint(BASE_INPUT);
    const second = generateFingerprint({ ...BASE_INPUT, type: "income" });

    expect(first).not.toBe(second);
  });

  it("deve gerar hashes diferentes quando a description muda", () => {
    const first = generateFingerprint(BASE_INPUT);
    const second = generateFingerprint({
      ...BASE_INPUT,
      description: "Farmacia",
    });

    expect(first).not.toBe(second);
  });

  it("deve ser insensivel a espacos e caixa na description", () => {
    const first = generateFingerprint(BASE_INPUT);
    const second = generateFingerprint({
      ...BASE_INPUT,
      description: "  MERCADO  ",
    });

    expect(first).toBe(second);
  });

  it("deve gerar hashes diferentes para userId diferente", () => {
    const first = generateFingerprint(BASE_INPUT);
    const second = generateFingerprint({
      ...BASE_INPUT,
      userId: "99999999-9999-4999-8999-999999999999",
    });

    expect(first).not.toBe(second);
  });
});
