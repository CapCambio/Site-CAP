import jwt from 'jsonwebtoken';

export interface User {
  email: string;
  name: string;
  isAdmin: boolean;
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRATION = 30 * 24 * 60 * 60 * 1000; // 30 dias em milissegundos

export class JwtService {
  /**
   * Gera um token JWT para o usuário
   */
  static generateToken(user: User): string {
    const payload = {
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '30d',
    });
  }

  /**
   * Verifica e decodifica um token JWT
   * Retorna o usuário se válido, null se inválido
   */
  static verifyToken(token: string): User | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return {
        email: decoded.email,
        name: decoded.name,
        isAdmin: decoded.isAdmin,
      };
    } catch (error) {
      console.error('Erro ao verificar JWT:', error);
      return null;
    }
  }

  /**
   * Decodifica um token JWT sem verificar a assinatura
   * Útil para extrair informações sem validar
   */
  static decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      console.error('Erro ao decodificar JWT:', error);
      return null;
    }
  }

  /**
   * Verifica se um token está expirado
   */
  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return true;
      
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp < now;
    } catch (error) {
      return true;
    }
  }

  /**
   * Retorna o tempo restante até a expiração do token em milissegundos
   * Retorna 0 se o token estiver expirado
   */
  static getTimeUntilExpiration(token: string): number {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return 0;
      
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = decoded.exp - now;
      return Math.max(0, timeLeft * 1000); // Converter para milissegundos
    } catch (error) {
      return 0;
    }
  }
}
