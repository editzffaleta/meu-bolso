/**
 * Decodifica um buffer de arquivo tentando UTF-8 primeiro. Extratos de bancos
 * BR frequentemente vem em Latin-1 (ISO-8859-1/CP1252); quando a decodificacao
 * UTF-8 produz o caractere de substituicao U+FFFD, redecodificamos como
 * `latin1` para preservar acentos.
 */
export function decodeStatementBuffer(buffer: Buffer): string {
  const utf8Content = buffer.toString('utf-8');

  if (utf8Content.includes('�')) {
    return buffer.toString('latin1');
  }

  return utf8Content;
}
