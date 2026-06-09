/**
 * Serviço de autenticação unificado
 * Fonte única da verdade para dados de usuários
 */
import * as db from '../db';
import { Session } from 'express-session';

export interface User {
  email: string;
  name: string;
  isAdmin: boolean;
  lastAccess?: string;
  createdAt?: string;
}

export class AuthService {
  private static instance: AuthService;
  private users: Map<string, User> = new Map();
  private lastLoad: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  private authAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos

  private constructor() {
    this.loadUsers();
  }

  /**
   * Mascarar email para logs (proteção de privacidade)
   */
  private maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    const maskedName = name.length > 2
      ? name.substring(0, 2) + '*'.repeat(name.length - 2)
      : name;
    return `${maskedName}@${domain}`;
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Carrega usuários do banco de dados (com cache)
   */
  private async loadUsers(): Promise<void> {
    const now = Date.now();
    
    // Se cache ainda válido, não recarrega
    if (this.users.size > 0 && (now - this.lastLoad) < this.CACHE_TTL) {
      return;
    }

    try {
      const users = await db.getUsers();
      
      this.users.clear();
      users.forEach((user: any) => {
        this.users.set(user.email.toLowerCase(), {
          email: user.email,
          name: user.name,
          isAdmin: user.is_admin,
          lastAccess: user.last_access,
          createdAt: user.created_at
        });
      });
      
      this.lastLoad = now;
      console.log(`🔐 ${this.users.size} usuários carregados do banco de dados`);
    } catch (error) {
      console.error('Erro ao carregar usuários do banco de dados:', error);
    }
  }

  /**
   * Autentica usuário
   */
  async authenticate(email: string): Promise<User | null> {
    await this.loadUsers();
    
    const emailLower = email.toLowerCase();
    const now = Date.now();
    
    // Verificar rate limiting
    const attempts = this.authAttempts.get(emailLower);
    if (attempts && attempts.count >= this.MAX_ATTEMPTS) {
      if (now - attempts.lastAttempt < this.LOCKOUT_DURATION) {
        console.warn(`Tentativas excedidas para: ${this.maskEmail(emailLower)}`);
        return null;
      }
      // Reset após lockout
      this.authAttempts.delete(emailLower);
    }
    
    const user = this.users.get(emailLower);
    
    if (user) {
      // Reset tentativas em sucesso
      this.authAttempts.delete(emailLower);
      // Atualiza último acesso no banco de dados
      try {
        await db.updateUser(emailLower, { last_access: new Date().toISOString() });
        user.lastAccess = new Date().toISOString();
      } catch (error) {
        console.error('Erro ao atualizar último acesso:', error);
      }
    } else {
      // Incrementar tentativas em falha
      const currentAttempts = this.authAttempts.get(emailLower) || { count: 0, lastAttempt: now };
      this.authAttempts.set(emailLower, {
        count: currentAttempts.count + 1,
        lastAttempt: now
      });
      
      // Log de tentativa
      const attemptCount = this.authAttempts.get(emailLower)!.count;
      if (attemptCount >= this.MAX_ATTEMPTS) {
        console.warn(`⚠️ Máximo de tentativas atingido para: ${this.maskEmail(emailLower)}`);
      }
    }
    
    return user || null;
  }

  /**
   * Verifica se usuário é admin
   */
  async isAdmin(email: string): Promise<boolean> {
    await this.loadUsers();
    const user = this.users.get(email.toLowerCase());
    return user?.isAdmin || false;
  }

  /**
   * Obtém todos os usuários
   */
  async getAllUsers(): Promise<User[]> {
    await this.loadUsers();
    return Array.from(this.users.values());
  }

  /**
   * Adiciona usuário
   */
  async addUser(email: string, name: string, isAdmin: boolean = false): Promise<void> {
    const emailLower = email.toLowerCase();
    
    try {
      await db.addUser({
        email: emailLower,
        name,
        is_admin: isAdmin,
        created_at: new Date().toISOString()
      });
      
      // Recarrega cache
      this.lastLoad = 0;
      await this.loadUsers();
      
      console.log(`➕ Usuário adicionado: ${this.maskEmail(emailLower)}`);
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
      throw error;
    }
  }

  /**
   * Remove usuário
   */
  async removeUser(email: string): Promise<boolean> {
    const emailLower = email.toLowerCase();
    
    try {
      const deleted = await db.deleteUser(emailLower);
      
      if (deleted) {
        // Recarrega cache
        this.lastLoad = 0;
        await this.loadUsers();
        console.log(`➖ Usuário removido: ${this.maskEmail(emailLower)}`);
      }
      
      return deleted;
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      return false;
    }
  }

  /**
   * Atualiza usuário
   */
  async updateUser(email: string, updates: Partial<Pick<User, 'name' | 'isAdmin'>>): Promise<boolean> {
    const emailLower = email.toLowerCase();
    
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.isAdmin !== undefined) dbUpdates.is_admin = updates.isAdmin;
      
      const updated = await db.updateUser(emailLower, dbUpdates);
      
      if (updated) {
        // Recarrega cache
        this.lastLoad = 0;
        await this.loadUsers();
        console.log(`✏️ Usuário atualizado: ${this.maskEmail(emailLower)}`);
      }
      
      return !!updated;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return false;
    }
  }

  /**
   * Limpa usuários inativos
   */
  async cleanupInactiveUsers(): Promise<number> {
    await this.loadUsers();
    
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
    
    const initialCount = this.users.size;
    const emailsToDelete: string[] = [];
    
    this.users.forEach((user, email) => {
      const lastAccess = user.lastAccess ? new Date(user.lastAccess) : null;
      const createdAt = user.createdAt ? new Date(user.createdAt) : null;
      
      // Se nunca acessou, verificar data de criação
      if (!lastAccess) {
        if (createdAt && createdAt < sixMonthsAgo) {
          emailsToDelete.push(email);
          console.log(`🗑️ Usuário sem acesso removido: ${this.maskEmail(email)}`);
        }
      } else {
        // Se acessou há mais de 1 ano, remove
        if (lastAccess < oneYearAgo) {
          emailsToDelete.push(email);
          console.log(`🗑️ Usuário inativo removido: ${this.maskEmail(email)}`);
        }
      }
    });
    
    // Remove do banco de dados
    for (const email of emailsToDelete) {
      try {
        await db.deleteUser(email);
        this.users.delete(email);
      } catch (error) {
        console.error(`Erro ao remover usuário ${email}:`, error);
      }
    }
    
    const removedCount = initialCount - this.users.size;
    
    if (removedCount > 0) {
      console.log(`🧹 Limpeza: ${removedCount} usuários inativos removidos`);
    }
    
    return removedCount;
  }

  /**
   * Cria sessão de usuário
   */
  createSession(user: User, session: Session & Partial<{ user: User }>): void {
    session.user = {
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin
    };
  }

  /**
   * Destroi sessão de usuário
   */
  destroySession(session: Session & { destroy: (callback?: (err?: any) => void) => void }): Promise<void> {
    return new Promise((resolve, reject) => {
      session.destroy((err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Obtém usuário da sessão
   */
  getSessionUser(session: Session & Partial<{ user: User }>): User | null {
    return session.user || null;
  }

  /**
   * Força recarregamento dos usuários
   */
  async forceReload(): Promise<void> {
    this.lastLoad = 0; // Força reload no próximo acesso
    await this.loadUsers();
  }
}

// Export instância única
export const authService = AuthService.getInstance();
