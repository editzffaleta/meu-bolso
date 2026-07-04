import { CsvStatementParserImpl } from './csv-statement.parser';

describe('CsvStatementParserImpl', () => {
  const parser = new CsvStatementParserImpl();

  it('deve parsear CSV com header padrao e datas ISO', async () => {
    const content = [
      'data,descricao,valor',
      '2026-06-01,Mercado Extra,-150.32',
      '2026-06-03,Salario,4500.00',
    ].join('\n');

    const rows = await parser.parse(content);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      date: new Date('2026-06-01T00:00:00.000Z'),
      description: 'Mercado Extra',
      amount: -150.32,
    });
    expect(rows[1]).toEqual({
      date: new Date('2026-06-03T00:00:00.000Z'),
      description: 'Salario',
      amount: 4500,
    });
  });

  it('deve aceitar sinonimos de coluna e ordem livre (date/description/amount)', async () => {
    const content = ['amount,date,description', '100.50,2026-01-10,Teste'].join(
      '\n',
    );

    const rows = await parser.parse(content);

    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(100.5);
    expect(rows[0].date).toEqual(new Date('2026-01-10T00:00:00.000Z'));
  });

  it('deve aceitar data no formato DD/MM/YYYY', async () => {
    const content = ['data,descricao,valor', '01/06/2026,Mercado,10.00'].join(
      '\n',
    );

    const rows = await parser.parse(content);

    expect(rows).toHaveLength(1);
    expect(rows[0].date).toEqual(new Date('2026-06-01T00:00:00.000Z'));
  });

  it('deve aceitar valor com separador de milhar e virgula decimal', async () => {
    const content = ['data,descricao,valor', '2026-06-01,Compra,1.234,56'].join(
      '\n',
    );

    const rows = await parser.parse(content);

    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(1234.56);
  });

  it('deve ignorar linhas sem header resolvido', async () => {
    const content = ['coluna1,coluna2', '2026-06-01,100'].join('\n');

    const rows = await parser.parse(content);

    expect(rows).toEqual([]);
  });

  it('deve ignorar linhas com data ou valor nao parseavel', async () => {
    const content = [
      'data,descricao,valor',
      'data-invalida,Compra,100',
      '2026-06-01,Compra,valor-invalido',
      '2026-06-02,Compra valida,50.00',
    ].join('\n');

    const rows = await parser.parse(content);

    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe('Compra valida');
  });

  it('deve retornar lista vazia para conteudo vazio', async () => {
    const rows = await parser.parse('');

    expect(rows).toEqual([]);
  });
});
