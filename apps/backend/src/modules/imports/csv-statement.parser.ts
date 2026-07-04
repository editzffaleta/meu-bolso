import { Injectable } from '@nestjs/common';
import { CsvStatementParser, StatementRow } from '@meubolso/imports';

const DATE_COLUMN_SYNONYMS = ['data', 'date', 'dt'];
const DESCRIPTION_COLUMN_SYNONYMS = [
  'descricao',
  'descrição',
  'description',
  'historico',
  'histórico',
  'memo',
];
const AMOUNT_COLUMN_SYNONYMS = ['valor', 'amount', 'value'];

/**
 * Parser de extratos em CSV com header flexivel. Ver `design.md` da change
 * 008-importacao-extratos para o formato aceito (delimitador `,`, sinonimos
 * de coluna, formatos de data/valor).
 */
@Injectable()
export class CsvStatementParserImpl implements CsvStatementParser {
  async parse(content: string): Promise<StatementRow[]> {
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return [];
    }

    const [headerLine, ...dataLines] = lines;
    const header = this.splitCsvLine(headerLine).map((column) =>
      this.normalizeColumnName(column),
    );

    const dateIndex = header.findIndex((column) =>
      DATE_COLUMN_SYNONYMS.includes(column),
    );
    const descriptionIndex = header.findIndex((column) =>
      DESCRIPTION_COLUMN_SYNONYMS.includes(column),
    );
    const amountIndex = header.findIndex((column) =>
      AMOUNT_COLUMN_SYNONYMS.includes(column),
    );

    if (dateIndex === -1 || descriptionIndex === -1 || amountIndex === -1) {
      return [];
    }

    const columnCount = header.length;
    const rows: StatementRow[] = [];

    for (const line of dataLines) {
      const columns = this.splitDataLine(line, columnCount, amountIndex);

      const rawDate = columns[dateIndex]?.trim();
      const rawDescription = columns[descriptionIndex]?.trim();
      const rawAmount = columns[amountIndex]?.trim();

      if (!rawDate || !rawDescription || !rawAmount) {
        continue;
      }

      const date = this.parseDate(rawDate);
      const amount = this.parseAmount(rawAmount);

      if (!date || amount === null) {
        continue;
      }

      rows.push({ date, description: rawDescription, amount });
    }

    return rows;
  }

  private splitCsvLine(line: string): string[] {
    return line.split(',').map((value) => value.trim());
  }

  /**
   * Faz o split de uma linha de dados considerando que o valor monetario pode
   * usar virgula como separador decimal (ex.: "1.234,56"), o que criaria uma
   * coluna extra num split ingenuo por virgula. Quando ha mais campos do que
   * colunas no header, junta o campo excedente de volta na coluna do valor
   * (assumindo que o excedente e a parte decimal apos a virgula).
   */
  private splitDataLine(
    line: string,
    columnCount: number,
    amountIndex: number,
  ): string[] {
    const rawColumns = this.splitCsvLine(line);

    if (rawColumns.length <= columnCount) {
      return rawColumns;
    }

    const extra = rawColumns.length - columnCount;
    const merged = [
      ...rawColumns.slice(0, amountIndex),
      rawColumns.slice(amountIndex, amountIndex + extra + 1).join(','),
      ...rawColumns.slice(amountIndex + extra + 1),
    ];

    return merged;
  }

  private normalizeColumnName(column: string): string {
    return column
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private parseDate(raw: string): Date | null {
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return this.buildUtcDate(Number(year), Number(month), Number(day));
    }

    const brMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (brMatch) {
      const [, day, month, year] = brMatch;
      return this.buildUtcDate(Number(year), Number(month), Number(day));
    }

    return null;
  }

  private buildUtcDate(year: number, month: number, day: number): Date | null {
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }

    return date;
  }

  private parseAmount(raw: string): number | null {
    let normalized = raw.replace(/\s/g, '');
    const isNegative = normalized.startsWith('-');

    if (isNegative) {
      normalized = normalized.slice(1);
    }

    const hasComma = normalized.includes(',');
    const hasDot = normalized.includes('.');

    if (hasComma && hasDot) {
      // formato "1.234,56": ponto e milhar, virgula e decimal
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else if (hasComma) {
      // formato "1234,56": virgula e decimal
      normalized = normalized.replace(',', '.');
    }

    if (!/^\d+(\.\d+)?$/.test(normalized)) {
      return null;
    }

    const value = Number(normalized);

    if (Number.isNaN(value)) {
      return null;
    }

    return isNegative ? -value : value;
  }
}
