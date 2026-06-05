/**
 * Middleware de autenticação unificado
 */
import { Request, Response, NextFunction } from 'express';
import { authService, User } from './AuthService';
import { sessionRegistry } from './SessionRegistry';

// Interface para estender Request
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Middleware de autenticação
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const sessionUser = authService.getSessionUser(req.session);
    
    if (!sessionUser) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }

    if (!sessionUser.isAdmin) {
      sessionRegistry.touchActivity(sessionUser.email, req.sessionID);
    }

    req.user = sessionUser;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * Middleware para exigir admin
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.user?.isAdmin) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }
    
    next();
  } catch (error) {
    console.error('Erro na verificação de admin:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * Middleware opcional (não falha se não autenticado)
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const sessionUser = authService.getSessionUser(req.session);
    req.user = sessionUser || undefined;
    next();
  } catch (error) {
    console.error('Erro na autenticação opcional:', error);
    next(); // Não falha, apenas não adiciona usuário
  }
}
