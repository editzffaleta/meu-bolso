import { Injectable } from '@nestjs/common';
import {
  OfxStatementParser,
  StatementParseResult,
  StatementRow,
} from '@meubolso/imports';

/**
 * Parser SGML minimo de extratos OFX. Extrai blocos `<STMTTRN>` (tolerante a
 * ausencia de `</STMTTRN>`) e le `<DTPOSTED>`, `<TRNAMT>` e `<MEMO>`
 * (fallback `<NAME>`). Ver `design.md` da change 008-importacao-extratos.
 */
@Injectable()
export class OfxStatementParserImpl implements OfxStatementParser {
  // Parsing e sincrono; a assinatura e Promise por contrato da porta StatementParser.
  // eslint-disable-next-line @typescript-eslint/require-await
  async parse(content: string): Promise<StatementParseResult> {
    const blocks = this.extractBlocks(content);
    const rows: StatementRow[] = [];
    let invalidRows = 0;

    for (const block of blocks) {
      const dtposted = this.extractTag(block, 'DTPOSTED');
      const trnamt = this.extractTag(block, 'TRNAMT');
      const memo =
        this.extractTag(block, 'MEMO') ?? this.extractTag(block, 'NAME');

      if (!dtposted || !trnamt || !memo) {
        invalidRows += 1;
        continue;
      }

      const date = this.parseOfxDate(dtposted);
      const amount = this.parseAmount(trnamt);

      if (!date || amount === null) {
        invalidRows += 1;
        continue;
      }

      rows.push({ date, description: memo.trim(), amount });
    }

    return { rows, invalidRows };
  }

  private extractBlocks(content: string): string[] {
    const blocks: string[] = [];
    const startTag = '<STMTTRN>';
    let searchFrom = 0;

    while (true) {
      const start = content.indexOf(startTag, searchFrom);

      if (start === -1) {
        break;
      }

      const contentStart = start + startTag.length;
      const endTag = content.indexOf('</STMTTRN>', contentStart);
      const nextStart = content.indexOf(startTag, contentStart);
      const bankTranListEnd = content.indexOf('</BANKTRANLIST>', contentStart);

      const candidates = [endTag, nextStart, bankTranListEnd].filter(
        (index) => index !== -1,
      );

      const blockEnd =
        candidates.length > 0 ? Math.min(...candidates) : content.length;

      blocks.push(content.slice(contentStart, blockEnd));
      searchFrom = blockEnd;
    }

    return blocks;
  }

  private extractTag(block: string, tag: string): string | null {
    const match = block.match(new RegExp(`<${tag}>([^<\r\n]*)`, 'i'));
    return match ? match[1].trim() : null;
  }

  private parseOfxDate(raw: string): Date | null {
    const digits = raw.replace(/\D/g, '').slice(0, 8);

    if (digits.length !== 8) {
      return null;
    }

    const year = Number(digits.slice(0, 4));
    const month = Number(digits.slice(4, 6));
    const day = Number(digits.slice(6, 8));

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    return new Date(Date.UTC(year, month - 1, day));
  }

  /**
   * Parse tolerante do valor OFX (`TRNAMT`), aceitando ponto ou virgula como
   * separador decimal (ex.: "-123.45" ou "-123,45"). OFX normalmente nao usa
   * separador de milhar, mas mantemos a normalizacao alinhada ao CSV.
   */
  private parseAmount(raw: string): number | null {
    let normalized = raw.replace(/\s/g, '');
    const isNegative = normalized.startsWith('-');

    if (isNegative || normalized.startsWith('+')) {
      normalized = normalized.slice(1);
    }

    const hasComma = normalized.includes(',');
    const hasDot = normalized.includes('.');

    if (hasComma && hasDot) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else if (hasComma) {
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
