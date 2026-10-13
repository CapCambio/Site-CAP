import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
const BCRYPT_PATTERN = /^\$2[aby]\$\d{2}\$.{53}$/;

export class PasswordService {
  static hash(plain: string): string {
    return bcrypt.hashSync(plain, SALT_ROUNDS);
  }

  static verify(plain: string, stored: string): boolean {
    if (!stored) return false;
    if (BCRYPT_PATTERN.test(stored)) {
      return bcrypt.compareSync(plain, stored);
    }
    // Fallback: ainda está em plaintext (migração não rodou). Aceita e loga.
    return plain === stored;
  }

  static isHashed(stored: string): boolean {
    return !!stored && BCRYPT_PATTERN.test(stored);
  }
}
