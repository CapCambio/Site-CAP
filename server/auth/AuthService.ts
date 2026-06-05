/**
 * Serviço de autenticação unificado
 * Fonte única da verdade para dados de usuários
 */
import fs from 'fs/promises';
import path from 'path';
import { Session } from 'express-session';

export interface User {
  email: string;
  name: string;
  isAdmin: boolean;
  lastAccess?: string;
  createdAt?: string;
}

export interface AuthConfig {
  users: User[];
}

export class AuthService {
  private static instance: AuthService;
  private configPath: string;
  private users: Map<string, User> = new Map();
  private lastLoad: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  private authAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos

  private constructor() {
    this.configPath = path.join(process.cwd(), 'server', 'config', 'users.json');
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
   * Carrega usuários do arquivo (com cache)
   */
  private async loadUsers(): Promise<void> {
    const now = Date.now();
    
    // Se cache ainda válido, não recarrega
    if (this.users.size > 0 && (now - this.lastLoad) < this.CACHE_TTL) {
      return;
    }

    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      const config: AuthConfig = JSON.parse(data);
      
      this.users.clear();
      config.users.forEach(user => {
        this.users.set(user.email.toLowerCase(), user);
      });
      
      this.lastLoad = now;
      console.log(`🔐 ${this.users.size} usuários carregados`);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      // Criar arquivo com usuário admin padrão
      await this.createDefaultConfig();
    }
  }

  /**
   * Cria configuração padrão
   */
  private async createDefaultConfig(): Promise<void> {
    const defaultConfig: AuthConfig = {
      users: [
        {
          email: 'capcambiocx@gmail.com',
          name: 'CAP Câmbio Admin',
          isAdmin: true,
          createdAt: new Date().toISOString()
        }
      ]
    };

    await fs.writeFile(this.configPath, JSON.stringify(defaultConfig, null, 2));
    
    this.users.clear();
    defaultConfig.users.forEach(user => {
      this.users.set(user.email.toLowerCase(), user);
    });
    
    console.log('📝 Configuração padrão criada');
  }

  /**
   * Salva usuários no arquivo
   */
  private async saveUsers(): Promise<void> {
    try {
      const config: AuthConfig = {
        users: Array.from(this.users.values())
      };
      
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
      console.log(`💾 ${this.users.size} usuários salvos`);
    } catch (error) {
      console.error('Erro ao salvar usuários:', error);
      throw error;
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
      // Atualiza último acesso
      user.lastAccess = new Date().toISOString();
      await this.saveUsers();
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
    await this.loadUsers();
    
    const emailLower = email.toLowerCase();
    
    if (this.users.has(emailLower)) {
      throw new Error('Usuário já existe');
    }
    
    const newUser: User = {
      email: emailLower,
      name,
      isAdmin,
      createdAt: new Date().toISOString()
    };
    
    this.users.set(emailLower, newUser);
    await this.saveUsers();
    
    console.log(`➕ Usuário adicionado: ${this.maskEmail(emailLower)}`);
  }

  /**
   * Remove usuário
   */
  async removeUser(email: string): Promise<boolean> {
    await this.loadUsers();
    
    const emailLower = email.toLowerCase();
    const deleted = this.users.delete(emailLower);
    
    if (deleted) {
      await this.saveUsers();
      console.log(`➖ Usuário removido: ${this.maskEmail(emailLower)}`);
    }
    
    return deleted;
  }

  /**
   * Atualiza usuário
   */
  async updateUser(email: string, updates: Partial<Pick<User, 'name' | 'isAdmin'>>): Promise<boolean> {
    await this.loadUsers();
    
    const emailLower = email.toLowerCase();
    const user = this.users.get(emailLower);
    
    if (!user) {
      return false;
    }
    
    Object.assign(user, updates);
    await this.saveUsers();
    
    console.log(`✏️ Usuário atualizado: ${this.maskEmail(emailLower)}`);
    return true;
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
    
    this.users.forEach((user, email) => {
      const lastAccess = user.lastAccess ? new Date(user.lastAccess) : null;
      const createdAt = user.createdAt ? new Date(user.createdAt) : null;
      
      // Se nunca acessou, verificar data de criação
      if (!lastAccess) {
        if (createdAt && createdAt < sixMonthsAgo) {
          this.users.delete(email);
          console.log(`🗑️ Usuário sem acesso removido: ${this.maskEmail(email)}`);
        }
      } else {
        // Se acessou há mais de 1 ano, remove
        if (lastAccess < oneYearAgo) {
          this.users.delete(email);
          console.log(`🗑️ Usuário inativo removido: ${this.maskEmail(email)}`);
        }
      }
    });
    
    const removedCount = initialCount - this.users.size;
    
    if (removedCount > 0) {
      await this.saveUsers();
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
