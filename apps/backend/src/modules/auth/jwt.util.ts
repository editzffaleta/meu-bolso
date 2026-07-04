import { sign } from 'jsonwebtoken';
import { LoginUserOut } from '@meubolso/auth';

const JWT_EXPIRES_IN = '7d';

/**
 * Assina o JWT de sessao a partir da saida do caso de uso `LoginUser`.
 * Helper exclusivo da camada HTTP: nao e provider de dominio e nao e
 * exportado ao modulo de negocio `auth`.
 */
export function signUserToken(user: LoginUserOut, secret: string): string {
  return sign(
    {
      sub: user.id,
      name: user.name,
      email: user.email,
    },
    secret,
    { expiresIn: JWT_EXPIRES_IN },
  );
}
