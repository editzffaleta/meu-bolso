import { OfxStatementParserImpl } from './ofx-statement.parser';

describe('OfxStatementParserImpl', () => {
  const parser = new OfxStatementParserImpl();

  it('deve parsear um bloco STMTTRN com fechamento explicito', async () => {
    const content = [
      '<STMTTRN>',
      '<TRNTYPE>DEBIT',
      '<DTPOSTED>20260601',
      '<TRNAMT>-150.32',
      '<MEMO>Mercado Extra',
      '</STMTTRN>',
    ].join('\n');

    const rows = await parser.parse(content);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      date: new Date('2026-06-01T00:00:00.000Z'),
      description: 'Mercado Extra',
      amount: -150.32,
    });
  });

  it('deve parsear multiplos blocos sem fechamento explicito de </STMTTRN>', async () => {
    const content = [
      '<BANKTRANLIST>',
      '<STMTTRN>',
      '<TRNTYPE>DEBIT',
      '<DTPOSTED>20260601120000',
      '<TRNAMT>-150.32',
      '<MEMO>Mercado Extra',
      '<STMTTRN>',
      '<TRNTYPE>CREDIT',
      '<DTPOSTED>20260603',
      '<TRNAMT>4500.00',
      '<MEMO>Salario',
      '</BANKTRANLIST>',
    ].join('\n');

    const rows = await parser.parse(content);

    expect(rows).toHaveLength(2);
    expect(rows[0].description).toBe('Mercado Extra');
    expect(rows[0].date).toEqual(new Date('2026-06-01T00:00:00.000Z'));
    expect(rows[1].description).toBe('Salario');
    expect(rows[1].amount).toBe(4500);
  });

  it('deve usar NAME como fallback quando MEMO estiver ausente', async () => {
    const content = [
      '<STMTTRN>',
      '<DTPOSTED>20260601',
      '<TRNAMT>-10.00',
      '<NAME>Fallback Name',
      '</STMTTRN>',
    ].join('\n');

    const rows = await parser.parse(content);

    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe('Fallback Name');
  });

  it('deve ignorar blocos sem DTPOSTED, TRNAMT ou MEMO/NAME', async () => {
    const content = ['<STMTTRN>', '<TRNAMT>-10.00', '</STMTTRN>'].join('\n');

    const rows = await parser.parse(content);

    expect(rows).toEqual([]);
  });

  it('deve retornar lista vazia quando nao ha blocos STMTTRN', async () => {
    const rows = await parser.parse('conteudo sem tags relevantes');

    expect(rows).toEqual([]);
  });
});
