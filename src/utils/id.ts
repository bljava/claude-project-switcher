import crypto from 'crypto';

export function createId(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
}
