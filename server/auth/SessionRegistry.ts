/**
 * Uma sessão ativa por usuário comum — a primeira prevalece.
 * Sessões abandonadas (ex.: após refresh com novo cookie) são liberadas automaticamente.
 */
import type { Store } from 'express-session';

interface ActiveSession {
  sessionId: string;
  createdAt: number;
  lastActivity: number;
}

export class SessionRegistry {
  private static instance: SessionRegistry;
  private readonly activeByEmail = new Map<string, ActiveSession>();

  static getInstance(): SessionRegistry {
    if (!SessionRegistry.instance) {
      SessionRegistry.instance = new SessionRegistry();
    }
    return SessionRegistry.instance;
  }

  private normalizeEmail(email: string): string {
    return email.toLowerCase();
  }

  touchActivity(email: string, sessionId: string): void {
    const key = this.normalizeEmail(email);
    const active = this.activeByEmail.get(key);
    if (active && active.sessionId === sessionId) {
      active.lastActivity = Date.now();
    }
  }

  /**
   * Libera sessão registrada em outro cookie (ex.: após refresh sem logout).
   */
  async releaseOrphan(
    email: string,
    store: Store,
    currentSessionId: string
  ): Promise<boolean> {
    const key = this.normalizeEmail(email);
    const active = this.activeByEmail.get(key);
    if (!active || active.sessionId === currentSessionId) {
      return true;
    }

    await this.destroySession(store, active.sessionId);
    this.activeByEmail.delete(key);
    return true;
  }

  /**
   * Libera sessão registrada se estiver expirada, morta no store ou abandonada.
   */
  async tryReleaseStale(
    email: string,
    store: Store,
    currentSessionId: string
  ): Promise<boolean> {
    const key = this.normalizeEmail(email);
    const active = this.activeByEmail.get(key);
    if (!active) {
      return true;
    }

    if (active.sessionId === currentSessionId) {
      return true;
    }

    // Verificar apenas se a sessão ainda está viva no store
    const alive = await this.isSessionAlive(store, active.sessionId);
    if (!alive) {
      this.activeByEmail.delete(key);
      return true;
    }

    return false;
  }

  /**
   * Indica se um novo login pode ser criado.
   */
  async canLogin(
    email: string,
    store: Store,
    currentSessionId: string
  ): Promise<boolean> {
    await this.tryReleaseStale(email, store, currentSessionId);

    const key = this.normalizeEmail(email);
    const active = this.activeByEmail.get(key);
    if (!active) {
      return true;
    }

    if (active.sessionId === currentSessionId) {
      return true;
    }

    const stillValid = await this.isSessionAlive(store, active.sessionId);
    if (!stillValid) {
      this.activeByEmail.delete(key);
      return true;
    }

    return false;
  }

  setActive(email: string, sessionId: string): void {
    const key = this.normalizeEmail(email);
    const now = Date.now();
    this.activeByEmail.set(key, {
      sessionId,
      createdAt: now,
      lastActivity: now,
    });
  }

  release(email: string, sessionId?: string): void {
    const key = this.normalizeEmail(email);
    const active = this.activeByEmail.get(key);
    if (!active) return;
    if (sessionId && active.sessionId !== sessionId) return;
    this.activeByEmail.delete(key);
  }

  private isSessionAlive(store: Store, sessionId: string): Promise<boolean> {
    return new Promise((resolve) => {
      store.get(sessionId, (err, session) => {
        resolve(!err && !!session?.user);
      });
    });
  }

  private destroySession(store: Store, sessionId: string): Promise<void> {
    return new Promise((resolve) => {
      store.destroy(sessionId, () => resolve());
    });
  }
}

export const sessionRegistry = SessionRegistry.getInstance();
