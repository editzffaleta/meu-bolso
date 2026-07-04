import { decodeStatementBuffer } from './decode-buffer.util';

describe('decodeStatementBuffer', () => {
  it('deve preservar conteudo valido em UTF-8', () => {
    const buffer = Buffer.from('Farmácia São João', 'utf-8');

    expect(decodeStatementBuffer(buffer)).toBe('Farmácia São João');
  });

  it('deve redecodificar como latin1 quando UTF-8 produz caractere de substituicao', () => {
    const buffer = Buffer.from('Farmácia São João', 'latin1');

    expect(decodeStatementBuffer(buffer)).toBe('Farmácia São João');
  });
});
