export type JwtPayload = {
  sub: string;
  name: string;
  email: string;
};

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function isJwtPayload(value: unknown): value is JwtPayload {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.sub === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.email === 'string'
  );
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const bytes = base64UrlToUint8Array(parts[1]);
    const json = new TextDecoder('utf-8').decode(bytes);
    const parsed: unknown = JSON.parse(json);

    return isJwtPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
