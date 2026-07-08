import { Request, Response, NextFunction } from 'express';
import { JwtService } from './JwtService';

/**
 * Middleware para renovação automática de JWT
 * Se o JWT tiver menos de 15 dias para expirar, gera um novo JWT com 30 dias
 * Renovação transparente para o usuário
 */
export const jwtRenewalMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.jwt;

  // Se não houver token, continuar
  if (!token) {
    return next();
  }

  // Verificar tempo até expiração
  const timeUntilExpiration = JwtService.getTimeUntilExpiration(token);

  // Se o token estiver expirado ou não for válido, continuar (será tratado pelo jwtMiddleware)
  if (timeUntilExpiration === 0) {
    return next();
  }

  // Se tiver menos de 15 dias para expirar, renovar
  const RENEWAL_THRESHOLD = 15 * 24 * 60 * 60 * 1000; // 15 dias em milissegundos

  if (timeUntilExpiration < RENEWAL_THRESHOLD) {
    const user = (req as any).user;

    if (user) {
      // Gerar novo token
      const newToken = JwtService.generateToken(user);

      // Atualizar cookie
      res.cookie('jwt', newToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
      });

      // Log de renovação (com rate limiting simples)
      const now = Date.now();
      const lastLogTime = (jwtRenewalMiddleware as any).lastLogTime || 0;
      if (!lastLogTime || (now - lastLogTime) > 60000) { // Log no máximo uma vez por minuto
        console.log(`🔄 JWT renovado para ${user.email} (${Math.round(timeUntilExpiration / (24 * 60 * 60 * 1000))} dias restantes)`);
        (jwtRenewalMiddleware as any).lastLogTime = now;
      }
    }
  }

  next();
};

// Variável estática para rate limiting de logs
(jwtRenewalMiddleware as any).lastLogTime = 0;
