import { Injectable } from '@nestjs/common';
import { OfxStatementParser, StatementRow } from '@meubolso/imports';

/**
 * Parser SGML minimo de extratos OFX. Extrai blocos `<STMTTRN>` (tolerante a
 * ausencia de `</STMTTRN>`) e le `<DTPOSTED>`, `<TRNAMT>` e `<MEMO>`
 * (fallback `<NAME>`). Ver `design.md` da change 008-importacao-extratos.
 */
@Injectable()
export class OfxStatementParserImpl implements OfxStatementParser {
  async parse(content: string): Promise<StatementRow[]> {
    const blocks = this.extractBlocks(content);
    const rows: StatementRow[] = [];

    for (const block of blocks) {
      const dtposted = this.extractTag(block, 'DTPOSTED');
      const trnamt = this.extractTag(block, 'TRNAMT');
      const memo =
        this.extractTag(block, 'MEMO') ?? this.extractTag(block, 'NAME');

      if (!dtposted || !trnamt || !memo) {
        continue;
      }

      const date = this.parseOfxDate(dtposted);
      const amount = Number(trnamt);

      if (!date || Number.isNaN(amount)) {
        continue;
      }

      rows.push({ date, description: memo.trim(), amount });
    }

    return rows;
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
}
