import { CryptoProvider } from "../../src";

/**
 * Fake com formato de hash compativel com BcryptHashRule
 * ($2b$10$ + 53 caracteres), para nao quebrar `validate()` da entidade `User`
 * nos testes do caso de uso `register-user`.
 */
export class FakeCryptoProvider implements CryptoProvider {
  private static readonly PREFIX = "$2b$10$";

  async hash(plain: string): Promise<string> {
    const body = Buffer.from(plain)
      .toString("base64")
      .replace(/[^./A-Za-z0-9]/g, "a")
      .padEnd(53, "a")
      .slice(0, 53);

    return `${FakeCryptoProvider.PREFIX}${body}`;
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return hashed === (await this.hash(plain));
  }
}
