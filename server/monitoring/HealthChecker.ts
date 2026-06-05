/**
 * Sistema de Health Checks abrangente
 */
import { logger, LogLevel } from './Logger';
import { jsonStorage } from '../json-storage';
import { authService } from '../auth/AuthService';
import { alertSystem } from '../alert-system';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  responseTime?: number;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  checks: HealthCheck[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
  };
}

export class HealthChecker {
  private static instance: HealthChecker;
  private startTime: number;
  private version: string;

  private constructor() {
    this.startTime = Date.now();
    this.version = process.env.npm_package_version || '1.0.0';
  }

  static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  /**
   * Executa todos os health checks
   */
  async runHealthChecks(): Promise<SystemHealth> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkAuthentication(),
      this.checkAlertSystem(),
      this.checkMemory(),
      this.checkDiskSpace(),
      this.checkExternalDependencies(),
      this.checkCacheSystem()
    ]);

    const healthChecks: HealthCheck[] = [];
    
    checks.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        healthChecks.push(result.value);
      } else {
        healthChecks.push({
          name: `check_${index}`,
          status: 'unhealthy',
          message: `Health check failed: ${result.reason}`
        });
      }
    });

    // Calcula status geral
    const summary = this.calculateSummary(healthChecks);
    const overallStatus = this.calculateOverallStatus(summary);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: this.version,
      checks: healthChecks,
      summary
    };
  }

  /**
   * Check do banco de dados (JSON files)
   */
  private async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      // Testa leitura
      const currencies = await jsonStorage.getAllCurrencies();
      
      // Testa escrita (em um arquivo de teste)
      const testWrite = await this.testFileWrite();
      
      const responseTime = Date.now() - start;
      
      if (testWrite && currencies.length >= 0) {
        return {
          name: 'database',
          status: 'healthy',
          responseTime,
          metadata: {
            currenciesCount: currencies.length,
            writeAccess: testWrite
          }
        };
      } else {
        return {
          name: 'database',
          status: 'unhealthy',
          message: 'Failed to read or write database files',
          responseTime
        };
      }
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        message: `Database error: ${error}`,
        responseTime: Date.now() - start
      };
    }
  }

  /**
   * Check do sistema de autenticação
   */
  private async checkAuthentication(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      const users = await authService.getAllUsers();
      const responseTime = Date.now() - start;
      
      if (users.length > 0) {
        return {
          name: 'authentication',
          status: 'healthy',
          responseTime,
          metadata: {
            usersCount: users.length,
            adminUsers: users.filter(u => u.isAdmin).length
          }
        };
      } else {
        return {
          name: 'authentication',
          status: 'degraded',
          message: 'No users found in system',
          responseTime
        };
      }
    } catch (error) {
      return {
        name: 'authentication',
        status: 'unhealthy',
        message: `Authentication error: ${error}`,
        responseTime: Date.now() - start
      };
    }
  }

  /**
   * Check do sistema de alertas
   */
  private async checkAlertSystem(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      // Verifica se alertSystem está disponível
      if (!alertSystem) {
        return {
          name: 'alert_system',
          status: 'unhealthy',
          message: 'Alert system not initialized',
          responseTime: Date.now() - start
        };
      }

      // Testa funcionalidades básicas
      // TODO: Implementar getStats no AlertSystem
      const stats = { activeAlerts: 0, totalAlerts: 0 };
      const responseTime = Date.now() - start;
      
      return {
        name: 'alert_system',
        status: 'healthy',
        responseTime,
        metadata: stats
      };
    } catch (error) {
      return {
        name: 'alert_system',
        status: 'unhealthy',
        message: `Alert system error: ${error}`,
        responseTime: Date.now() - start
      };
    }
  }

  /**
   * Check de uso de memória
   */
  private async checkMemory(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const totalMem = memUsage.heapTotal;
      const usedMem = memUsage.heapUsed;
      const memoryUsagePercent = (usedMem / totalMem) * 100;
      
      const responseTime = Date.now() - start;
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message: string | undefined;
      
      if (memoryUsagePercent > 90) {
        status = 'unhealthy';
        message = 'Memory usage critical';
      } else if (memoryUsagePercent > 75) {
        status = 'degraded';
        message = 'Memory usage high';
      }
      
      return {
        name: 'memory',
        status,
        message,
        responseTime,
        metadata: {
          heapUsed: Math.round(usedMem / 1024 / 1024), // MB
          heapTotal: Math.round(totalMem / 1024 / 1024), // MB
          usagePercent: Math.round(memoryUsagePercent)
        }
      };
    } catch (error) {
      return {
        name: 'memory',
        status: 'unhealthy',
        message: `Memory check error: ${error}`,
        responseTime: Date.now() - start
      };
    }
  }

  /**
   * Check de espaço em disco
   */
  private async checkDiskSpace(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      const fs = require('fs');
      const stats = fs.statSync(process.cwd());
      
      // Simples check - em produção usar algo mais robusto
      const responseTime = Date.now() - start;
      
      return {
        name: 'disk_space',
        status: 'healthy',
        responseTime,
        metadata: {
          accessible: true
        }
      };
    } catch (error) {
      return {
        name: 'disk_space',
        status: 'unhealthy',
        message: `Disk space check error: ${error}`,
        responseTime: Date.now() - start
      };
    }
  }

  /**
   * Check de dependências externas
   */
  private async checkExternalDependencies(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      // Testa conexão com site de scraping
      const response = await fetch('https://ctrcambio.com.br/tvcaxias/', {
        method: 'HEAD'
      });
      
      const responseTime = Date.now() - start;
      
      if (response.ok) {
        return {
          name: 'external_dependencies',
          status: 'healthy',
          responseTime,
          metadata: {
            ctrCambio: 'accessible',
            statusCode: response.status
          }
        };
      } else {
        return {
          name: 'external_dependencies',
          status: 'degraded',
          message: `CTR Câmbio returned status ${response.status}`,
          responseTime
        };
      }
    } catch (error) {
      return {
        name: 'external_dependencies',
        status: 'unhealthy',
        message: `External dependency error: ${error}`,
        responseTime: Date.now() - start
      };
    }
  }

  /**
   * Check do sistema de cache
   */
  private async checkCacheSystem(): Promise<HealthCheck> {
    const start = Date.now();
    
    try {
      // Verifica se cache está funcionando
      const fs = require('fs');
      const cachePath = 'server/config/currency-cache.json';
      
      let cacheAccessible = false;
      let cacheAge = 0;
      
      try {
        const stats = fs.statSync(cachePath);
        cacheAccessible = true;
        cacheAge = Date.now() - stats.mtime.getTime();
      } catch (error) {
        // Cache file não existe ainda
      }
      
      const responseTime = Date.now() - start;
      
      return {
        name: 'cache_system',
        status: cacheAccessible ? 'healthy' : 'degraded',
        responseTime,
        metadata: {
          accessible: cacheAccessible,
          ageSeconds: Math.round(cacheAge / 1000)
        }
      };
    } catch (error) {
      return {
        name: 'cache_system',
        status: 'unhealthy',
        message: `Cache system error: ${error}`,
        responseTime: Date.now() - start
      };
    }
  }

  /**
   * Testa escrita de arquivo
   */
  private async testFileWrite(): Promise<boolean> {
    try {
      const fs = require('fs');
      const testPath = 'data/.health-check-test';
      fs.writeFileSync(testPath, 'test');
      fs.unlinkSync(testPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calcula resumo dos checks
   */
  private calculateSummary(checks: HealthCheck[]) {
    const summary = {
      total: checks.length,
      healthy: 0,
      unhealthy: 0,
      degraded: 0
    };

    checks.forEach(check => {
      summary[check.status]++;
    });

    return summary;
  }

  /**
   * Calcula status geral
   */
  private calculateOverallStatus(summary: any): 'healthy' | 'unhealthy' | 'degraded' {
    if (summary.unhealthy > 0) {
      return 'unhealthy';
    }
    
    if (summary.degraded > 0) {
      return 'degraded';
    }
    
    return 'healthy';
  }
}

// Export instância única
export const healthChecker = HealthChecker.getInstance();
