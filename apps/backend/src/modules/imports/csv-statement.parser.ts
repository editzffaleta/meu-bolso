import { Injectable } from '@nestjs/common';
import {
  CsvStatementParser,
  StatementParseResult,
  StatementRow,
} from '@meubolso/imports';

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
 * 008-importacao-extratos para o formato aceito (delimitador `,` ou `;`
 * detectado automaticamente pelo header, campos entre aspas, sinonimos de
 * coluna, formatos de data/valor).
 */
@Injectable()
export class CsvStatementParserImpl implements CsvStatementParser {
  // Parsing e sincrono; a assinatura e Promise por contrato da porta StatementParser.
  // eslint-disable-next-line @typescript-eslint/require-await
  async parse(content: string): Promise<StatementParseResult> {
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return { rows: [], invalidRows: 0 };
    }

    const [headerLine, ...dataLines] = lines;
    const delimiter = this.detectDelimiter(headerLine);
    const header = this.tokenizeLine(headerLine, delimiter).map((column) =>
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
      return { rows: [], invalidRows: 0 };
    }

    const rows: StatementRow[] = [];
    let invalidRows = 0;

    for (const line of dataLines) {
      const columns = this.tokenizeLine(line, delimiter);

      const rawDate = columns[dateIndex]?.trim();
      const rawDescription = columns[descriptionIndex]?.trim();
      const rawAmount = columns[amountIndex]?.trim();

      if (!rawDate || !rawDescription || !rawAmount) {
        invalidRows += 1;
        continue;
      }

      const date = this.parseDate(rawDate);
      const amount = this.parseAmount(rawAmount);

      if (!date || amount === null) {
        invalidRows += 1;
        continue;
      }

      rows.push({ date, description: rawDescription, amount });
    }

    return { rows, invalidRows };
  }

  /**
   * Detecta o delimitador (`,` ou `;`) a partir da linha de header, contando
   * qual dos dois caracteres aparece mais vezes fora de aspas.
   */
  private detectDelimiter(headerLine: string): ',' | ';' {
    let commaCount = 0;
    let semicolonCount = 0;
    let insideQuotes = false;

    for (let i = 0; i < headerLine.length; i += 1) {
      const char = headerLine[i];

      if (char === '"') {
        insideQuotes = !insideQuotes;
        continue;
      }

      if (insideQuotes) {
        continue;
      }

      if (char === ',') {
        commaCount += 1;
      } else if (char === ';') {
        semicolonCount += 1;
      }
    }

    return semicolonCount > commaCount ? ';' : ',';
  }

  /**
   * Tokeniza uma linha CSV respeitando campos entre aspas duplas (podendo
   * conter o delimitador e quebras representadas por aspas escapadas `""`).
   */
  private tokenizeLine(line: string, delimiter: string): string[] {
    const columns: string[] = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];

      if (insideQuotes) {
        if (char === '"') {
          if (line[i + 1] === '"') {
            current += '"';
            i += 1;
          } else {
            insideQuotes = false;
          }
        } else {
          current += char;
        }
        continue;
      }

      if (char === '"') {
        insideQuotes = true;
        continue;
      }

      if (char === delimiter) {
        columns.push(current.trim());
        current = '';
        continue;
      }

      current += char;
    }

    columns.push(current.trim());

    return columns;
  }

  private normalizeColumnName(column: string): string {
    return column.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
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
