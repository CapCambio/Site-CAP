import { Request, Response, NextFunction } from 'express';
import { JwtService, User } from './JwtService';
import { UserValidationCache } from './UserValidationCache';

/**
 * Middleware para autenticação JWT
 * Extrai o JWT do cookie, valida e adiciona o usuário ao request
 */
export const jwtMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Extrair token do cookie
  const token = req.cookies?.jwt;

  // Se não houver token, continuar sem usuário (para endpoints públicos)
  if (!token) {
    return next();
  }

  // Verificar e decodificar o token
  const user = JwtService.verifyToken(token);

  if (!user) {
    // Token inválido ou expirado
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }

  // Verificar se o usuário ainda está autorizado (cache de 24h)
  const isAuthorized = await UserValidationCache.isUserAuthorized(user.email);

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Usuário não autorizado' });
  }

  // Adicionar usuário ao request
  (req as any).user = user;

  next();
};

/**
 * Middleware para proteger rotas que requerem autenticação
 * Retorna 401 se não houver usuário autenticado
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  if (!(req as any).user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  next();
};

/**
 * Middleware para proteger rotas que requerem admin
 * Retorna 403 se o usuário não for admin
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  if (!user.isAdmin) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  next();
};

/**
 * Middleware opcional para autenticação
 * Não retorna erro se não houver usuário, apenas adiciona req.user se existir
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  // Extrair token do cookie
  const token = req.cookies?.jwt;

  // Se não houver token, continuar sem usuário
  if (!token) {
    return next();
  }

  // Verificar e decodificar o token
  const user = JwtService.verifyToken(token);

  if (user) {
    // Verificar se o usuário ainda está autorizado (cache de 24h)
    const isAuthorized = await UserValidationCache.isUserAuthorized(user.email);

    if (isAuthorized) {
      (req as any).user = user;
    }
  }

  next();
};
