import { ValidationException } from "@meubolso/shared";
import {
  Import,
  ImportState,
} from "../../../src/import/model/import.entity";

const VALID_USER_ID = "11111111-1111-4111-8111-111111111111";
const VALID_ACCOUNT_ID = "22222222-2222-4222-8222-222222222222";

function buildProps(overrides: Partial<ImportState> = {}): ImportState {
  return {
    fileName: "extrato.csv",
    format: "csv",
    status: "processing",
    accountId: VALID_ACCOUNT_ID,
    totalRows: 0,
    importedRows: 0,
    duplicateRows: 0,
    invalidRows: 0,
    userId: VALID_USER_ID,
    ...overrides,
  };
}

function getValidationMessages(callback: () => void): string[] {
  try {
    callback();
    return [];
  } catch (error) {
    return (error as ValidationException).errors.map((item) => item.message);
  }
}

describe("Import entity", () => {
  it("deve criar uma entidade valida com os getters corretos", () => {
    const entity = new Import(buildProps());

    expect(entity.fileName).toBe("extrato.csv");
    expect(entity.format).toBe("csv");
    expect(entity.status).toBe("processing");
    expect(entity.accountId).toBe(VALID_ACCOUNT_ID);
    expect(entity.totalRows).toBe(0);
    expect(entity.importedRows).toBe(0);
    expect(entity.duplicateRows).toBe(0);
    expect(entity.invalidRows).toBe(0);
    expect(entity.userId).toBe(VALID_USER_ID);
    expect(entity.id).toBeDefined();
    expect(entity.createdAt).toBeInstanceOf(Date);
    expect(entity.updatedAt).toBeInstanceOf(Date);
    expect(entity.deletedAt).toBeNull();
  });

  it("deve aplicar defaults quando status/contadores nao informados", () => {
    const entity = new Import(
      buildProps({
        status: undefined as unknown as ImportState["status"],
        totalRows: undefined as unknown as number,
        importedRows: undefined as unknown as number,
        duplicateRows: undefined as unknown as number,
        invalidRows: undefined as unknown as number,
      }),
    );

    expect(entity.status).toBe("processing");
    expect(entity.totalRows).toBe(0);
    expect(entity.importedRows).toBe(0);
    expect(entity.duplicateRows).toBe(0);
    expect(entity.invalidRows).toBe(0);
    expect(() => entity.validate()).not.toThrow();
  });

  it("deve permitir existir invalida antes de validate() ser chamado (lazy)", () => {
    expect(
      () =>
        new Import(
          buildProps({
            fileName: "",
            format: "invalid" as unknown as ImportState["format"],
            accountId: "nao-e-uuid",
            userId: "nao-e-uuid",
          }),
        ),
    ).not.toThrow();
  });

  it("nao deve lancar erro ao validar uma entidade valida", () => {
    const entity = new Import(buildProps());

    expect(() => entity.validate()).not.toThrow();
  });

  it("clone() deve preservar id e createdAt e atualizar updatedAt", () => {
    const entity = new Import(buildProps());
    const cloned = entity.clone({ status: "done" });

    expect(cloned.id).toBe(entity.id);
    expect(cloned.createdAt).toEqual(entity.createdAt);
    expect(cloned.status).toBe("done");
  });

  describe("validacao de fileName", () => {
    it("deve rejeitar fileName vazio", () => {
      const entity = new Import(buildProps({ fileName: "" }));
      const messages = getValidationMessages(() => entity.validate());

      expect(messages.some((message) => message.includes("import.fileName"))).toBe(
        true,
      );
    });
  });

  describe("validacao de format", () => {
    it("deve rejeitar format vazio", () => {
      const entity = new Import(
        buildProps({ format: "" as unknown as ImportState["format"] }),
      );
      const messages = getValidationMessages(() => entity.validate());

      expect(messages.some((message) => message.includes("import.format"))).toBe(
        true,
      );
    });

    it("deve rejeitar format fora do enum permitido", () => {
      const entity = new Import(
        buildProps({ format: "xlsx" as unknown as ImportState["format"] }),
      );
      const messages = getValidationMessages(() => entity.validate());

      expect(messages.some((message) => message.includes("import.format"))).toBe(
        true,
      );
    });

    it.each(["csv", "ofx"] as const)("deve aceitar format %s", (format) => {
      const entity = new Import(buildProps({ format }));

      expect(() => entity.validate()).not.toThrow();
    });
  });

  describe("validacao de status", () => {
    it("deve rejeitar status fora do enum permitido", () => {
      const entity = new Import(
        buildProps({ status: "invalid" as unknown as ImportState["status"] }),
      );
      const messages = getValidationMessages(() => entity.validate());

      expect(messages.some((message) => message.includes("import.status"))).toBe(
        true,
      );
    });

    it.each(["processing", "done", "failed"] as const)(
      "deve aceitar status %s",
      (status) => {
        const entity = new Import(buildProps({ status }));

        expect(() => entity.validate()).not.toThrow();
      },
    );
  });

  describe("validacao de accountId", () => {
    it("deve rejeitar accountId vazio", () => {
      const entity = new Import(buildProps({ accountId: "" }));
      const messages = getValidationMessages(() => entity.validate());

      expect(
        messages.some((message) => message.includes("import.accountId")),
      ).toBe(true);
    });

    it("deve rejeitar accountId que nao e uuid", () => {
      const entity = new Import(buildProps({ accountId: "nao-e-uuid" }));
      const messages = getValidationMessages(() => entity.validate());

      expect(
        messages.some((message) => message.includes("import.accountId")),
      ).toBe(true);
    });
  });

  describe("validacao de userId", () => {
    it("deve rejeitar userId vazio", () => {
      const entity = new Import(buildProps({ userId: "" }));
      const messages = getValidationMessages(() => entity.validate());

      expect(messages.some((message) => message.includes("import.userId"))).toBe(
        true,
      );
    });

    it("deve rejeitar userId que nao e uuid", () => {
      const entity = new Import(buildProps({ userId: "nao-e-uuid" }));
      const messages = getValidationMessages(() => entity.validate());

      expect(messages.some((message) => message.includes("import.userId"))).toBe(
        true,
      );
    });
  });

  it("deve acumular multiplos erros de validacao ao mesmo tempo", () => {
    const entity = new Import(
      buildProps({
        fileName: "",
        format: "invalid" as unknown as ImportState["format"],
        accountId: "nao-e-uuid",
        userId: "nao-e-uuid",
      }),
    );
    const messages = getValidationMessages(() => entity.validate());

    expect(messages.length).toBeGreaterThanOrEqual(4);
  });
});
