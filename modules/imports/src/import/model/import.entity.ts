import {
  Entity,
  EntityState,
  InRule,
  RequiredRule,
  UuidRule,
  Validator,
} from "@meubolso/shared";

export type ImportFormat = "csv" | "ofx";

export const IMPORT_FORMATS: ImportFormat[] = ["csv", "ofx"];

export type ImportStatus = "processing" | "done" | "failed";

export const IMPORT_STATUSES: ImportStatus[] = [
  "processing",
  "done",
  "failed",
];

export interface ImportState extends EntityState {
  fileName: string;
  format: ImportFormat;
  status: ImportStatus;
  accountId: string;
  totalRows: number;
  importedRows: number;
  duplicateRows: number;
  userId: string;
}

export class Import extends Entity<ImportState> {
  constructor(props: ImportState) {
    super({
      ...props,
      status: props.status ?? "processing",
      totalRows: props.totalRows ?? 0,
      importedRows: props.importedRows ?? 0,
      duplicateRows: props.duplicateRows ?? 0,
    });
  }

  get fileName(): string {
    return this.props.fileName;
  }

  get format(): ImportFormat {
    return this.props.format;
  }

  get status(): ImportStatus {
    return this.props.status;
  }

  get accountId(): string {
    return this.props.accountId;
  }

  get totalRows(): number {
    return this.props.totalRows;
  }

  get importedRows(): number {
    return this.props.importedRows;
  }

  get duplicateRows(): number {
    return this.props.duplicateRows;
  }

  get userId(): string {
    return this.props.userId;
  }

  public validate(): void {
    Validator.validate([
      {
        code: "import.fileName",
        value: this.fileName,
        rules: [new RequiredRule()],
      },
      {
        code: "import.format",
        value: this.format,
        rules: [new RequiredRule(), new InRule(IMPORT_FORMATS)],
      },
      {
        code: "import.status",
        value: this.status,
        rules: [new RequiredRule(), new InRule(IMPORT_STATUSES)],
      },
      {
        code: "import.accountId",
        value: this.accountId,
        rules: [new RequiredRule(), new UuidRule()],
      },
      {
        code: "import.userId",
        value: this.userId,
        rules: [new RequiredRule(), new UuidRule()],
      },
    ]);
  }
}
