import { CsvStatementParserImpl } from './csv-statement.parser';

describe('CsvStatementParserImpl', () => {
  const parser = new CsvStatementParserImpl();

  it('deve parsear CSV com header padrao e datas ISO', async () => {
    const content = [
      'data,descricao,valor',
      '2026-06-01,Mercado Extra,-150.32',
      '2026-06-03,Salario,4500.00',
    ].join('\n');

    const { rows, invalidRows } = await parser.parse(content);

    expect(invalidRows).toBe(0);
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

    const { rows, invalidRows } = await parser.parse(content);

    expect(invalidRows).toBe(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(100.5);
    expect(rows[0].date).toEqual(new Date('2026-01-10T00:00:00.000Z'));
  });

  it('deve aceitar data no formato DD/MM/YYYY', async () => {
    const content = ['data,descricao,valor', '01/06/2026,Mercado,10.00'].join(
      '\n',
    );

    const { rows, invalidRows } = await parser.parse(content);

    expect(invalidRows).toBe(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].date).toEqual(new Date('2026-06-01T00:00:00.000Z'));
  });

  it('deve aceitar valor com separador de milhar e virgula decimal quando entre aspas', async () => {
    const content = [
      'data,descricao,valor',
      '2026-06-01,Compra,"1.234,56"',
    ].join('\n');

    const { rows, invalidRows } = await parser.parse(content);

    expect(invalidRows).toBe(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(1234.56);
  });

  it('deve ignorar linhas sem header resolvido', async () => {
    const content = ['coluna1,coluna2', '2026-06-01,100'].join('\n');

    const { rows, invalidRows } = await parser.parse(content);

    expect(rows).toEqual([]);
    expect(invalidRows).toBe(0);
  });

  it('deve contar em invalidRows linhas com data ou valor nao parseavel, sem descarta-las em silencio', async () => {
    const content = [
      'data,descricao,valor',
      'data-invalida,Compra,100',
      '2026-06-01,Compra,valor-invalido',
      '2026-06-02,Compra valida,50.00',
    ].join('\n');

    const { rows, invalidRows } = await parser.parse(content);

    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe('Compra valida');
    expect(invalidRows).toBe(2);
  });

  it('deve retornar lista vazia e invalidRows zero para conteudo vazio', async () => {
    const { rows, invalidRows } = await parser.parse('');

    expect(rows).toEqual([]);
    expect(invalidRows).toBe(0);
  });

  it('deve parsear descricao com virgula entre aspas e valor com ponto decimal', async () => {
    const content = [
      'data,descricao,valor',
      '2026-06-01,"PADARIA, PAES",-12.50',
    ].join('\n');

    const { rows, invalidRows } = await parser.parse(content);

    expect(invalidRows).toBe(0);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      date: new Date('2026-06-01T00:00:00.000Z'),
      description: 'PADARIA, PAES',
      amount: -12.5,
    });
  });

  it('deve tratar descricao terminando em ",<digitos>" sem aspas por posicao de coluna (nao rouba digitos do valor via merge magico)', async () => {
    // Sem aspas, "Compra 123,45,-10.00" produz colunas extras alem do header
    // (3 colunas esperadas, 4 encontradas). Comportamento documentado: o
    // parser respeita estritamente a POSICAO das colunas do header -- a
    // coluna "valor" (indice 2) captura o 3º campo bruto ("45"), e o 4º campo
    // ("-10.00") e descartado por nao ter coluna correspondente. Isso e
    // deterministico e nao "rouba" digitos via heuristica de merge (o
    // comportamento antigo, ingenuo, unia o excedente na coluna do valor).
    const content = [
      'data,descricao,valor',
      '2026-06-01,Compra 123,45,-10.00',
    ].join('\n');

    const { rows, invalidRows } = await parser.parse(content);

    expect(invalidRows).toBe(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe('Compra 123');
    expect(rows[0].amount).toBe(45);
  });

  it('deve tratar aspas escapadas ("") dentro de um campo entre aspas', async () => {
    const content = [
      'data,descricao,valor',
      '2026-06-01,"Compra ""especial""",-20.00',
    ].join('\n');

    const { rows, invalidRows } = await parser.parse(content);

    expect(invalidRows).toBe(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe('Compra "especial"');
  });

  it('deve detectar automaticamente o delimitador ";" (M4)', async () => {
    const content = [
      'data;descricao;valor',
      '2026-06-01;"PADARIA, PAES";-12,50',
      '2026-06-02;Salario;4500,00',
    ].join('\n');

    const { rows, invalidRows } = await parser.parse(content);

    expect(invalidRows).toBe(0);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      date: new Date('2026-06-01T00:00:00.000Z'),
      description: 'PADARIA, PAES',
      amount: -12.5,
    });
    expect(rows[1].amount).toBe(4500);
  });

  it('deve contar em invalidRows uma linha com colunas faltando', async () => {
    const content = [
      'data,descricao,valor',
      '2026-06-01,Compra sem valor',
    ].join('\n');

    const { rows, invalidRows } = await parser.parse(content);

    expect(rows).toEqual([]);
    expect(invalidRows).toBe(1);
  });
});
