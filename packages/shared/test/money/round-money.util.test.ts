import { roundMoney } from "../../src/money/round-money.util";

describe("roundMoney", () => {
  it("arredonda somas classicas de erro de ponto flutuante (0.1 + 0.2)", () => {
    const sum = 0.1 + 0.2 + 0.1 + 0.2 + 0.1 + 0.2;

    expect(roundMoney(sum)).toBe(0.9);
  });

  it("arredonda 10.10 + 20.20 + 5.05 para 35.35", () => {
    const sum = 10.1 + 20.2 + 5.05;

    expect(roundMoney(sum)).toBe(35.35);
  });

  it("mantem valores ja arredondados inalterados", () => {
    expect(roundMoney(100)).toBe(100);
    expect(roundMoney(-42.5)).toBe(-42.5);
  });

  it("arredonda para 2 casas decimais (nao trunca)", () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(2.345)).toBeCloseTo(2.35, 2);
  });
});
