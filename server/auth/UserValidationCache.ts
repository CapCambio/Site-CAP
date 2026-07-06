import * as db from '../db';

interface CacheEntry {
  valid: boolean;
  lastCheck: Date;
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas em milissegundos

export class UserValidationCache {
  private static cache = new Map<string, CacheEntry>();

  /**
   * Verifica se um usuário está autorizado
   * Usa cache se disponível e não expirado, senão faz query ao banco
   */
  static async isUserAuthorized(email: string): Promise<boolean> {
    const emailLower = email.toLowerCase();
    const now = new Date();
    const cached = this.cache.get(emailLower);

    // Se existe cache e não expirou, usar cache
    if (cached && (now.getTime() - cached.lastCheck.getTime()) < CACHE_TTL) {
      return cached.valid;
    }

    // Cache expirado ou não existe, fazer query ao banco
    try {
      const user = await db.getUserByEmail(emailLower);
      const isValid = !!user;

      // Atualizar cache
      this.cache.set(emailLower, {
        valid: isValid,
        lastCheck: now,
      });

      return isValid;
    } catch (error) {
      console.error('Erro ao validar usuário no banco:', error);
      // Em caso de erro, retorna false por segurança
      return false;
    }
  }

  /**
   * Força a atualização do cache para um usuário específico
   */
  static async refreshUserAuthorization(email: string): Promise<void> {
    const emailLower = email.toLowerCase();
    const now = new Date();

    try {
      const user = await db.getUserByEmail(emailLower);
      const isValid = !!user;

      this.cache.set(emailLower, {
        valid: isValid,
        lastCheck: now,
      });
    } catch (error) {
      console.error('Erro ao atualizar cache de usuário:', error);
    }
  }

  /**
   * Remove um usuário do cache (útil para invalidação manual)
   */
  static invalidateUser(email: string): void {
    const emailLower = email.toLowerCase();
    this.cache.delete(emailLower);
  }

  /**
   * Limpa entradas expiradas do cache
   * Deve ser chamado periodicamente para evitar crescimento indefinido
   */
  static cleanupExpiredEntries(): void {
    const now = new Date();
    const entriesToDelete: string[] = [];

    this.cache.forEach((entry, email) => {
      if ((now.getTime() - entry.lastCheck.getTime()) >= CACHE_TTL) {
        entriesToDelete.push(email);
      }
    });

    entriesToDelete.forEach(email => this.cache.delete(email));

    if (entriesToDelete.length > 0) {
      console.log(`🧹 Cache limpo: ${entriesToDelete.length} entradas expiradas removidas`);
    }
  }

  /**
   * Retorna estatísticas do cache (para monitoramento)
   */
  static getStats(): { size: number; entries: Array<{ email: string; valid: boolean; lastCheck: Date }> } {
    const entries: Array<{ email: string; valid: boolean; lastCheck: Date }> = [];
    this.cache.forEach((entry, email) => {
      entries.push({
        email,
        valid: entry.valid,
        lastCheck: entry.lastCheck,
      });
    });

    return {
      size: this.cache.size,
      entries,
    };
  }
}
