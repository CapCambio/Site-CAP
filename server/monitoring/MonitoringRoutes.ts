/**
 * Rotas de monitoramento e health checks
 */
import { Router, Request, Response } from 'express';
import { healthChecker, SystemHealth } from './HealthChecker';
import { logger, LogLevel } from './Logger';
import { authService } from '../auth/AuthService';
import { authenticate, requireAdmin } from '../auth/AuthMiddleware';

const router = Router();

/**
 * Health check básico (compatibilidade com existente)
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await healthChecker.runHealthChecks();
    
    // Resposta simples para compatibilidade
    res.json({
      status: health.status,
      timestamp: health.timestamp,
      uptime: health.uptime
    });
  } catch (error) {
    logger.error('Health check failed', 'monitoring', { error });
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

/**
 * Health check detalhado
 */
router.get('/health/detailed', async (req: Request, res: Response) => {
  try {
    const health = await healthChecker.runHealthChecks();
    
    res.json(health);
  } catch (error) {
    logger.error('Detailed health check failed', 'monitoring', { error });
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

/**
 * Logs do sistema (requer admin)
 */
router.get('/logs', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const level = req.query.level as string;
    const module = req.query.module as string;
    const limit = parseInt(req.query.limit as string) || 100;
    
    let logs = logger.getRecentLogs(limit);
    
    // Filtra por nível se especificado
    if (level) {
      const logLevel = LogLevel[level.toUpperCase() as keyof typeof LogLevel];
      if (logLevel !== undefined) {
        logs = logs.filter(log => log.level === logLevel);
      }
    }
    
    // Filtra por módulo se especificado
    if (module) {
      logs = logs.filter(log => log.module === module);
    }
    
    res.json({
      logs,
      total: logs.length,
      filters: { level, module, limit }
    });
  } catch (error) {
    logger.error('Failed to get logs', 'monitoring', { error });
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

/**
 * Estatísticas dos logs
 */
router.get('/logs/stats', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const stats = logger.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get log stats', 'monitoring', { error });
    res.status(500).json({ error: 'Failed to get log stats' });
  }
});

/**
 * Métricas do sistema
 */
router.get('/metrics', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const health = await healthChecker.runHealthChecks();
    const logStats = logger.getStats();
    const users = await authService.getAllUsers();
    
    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: health.uptime,
        version: health.version,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      performance: {
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      application: {
        totalUsers: users.length,
        adminUsers: users.filter(u => u.isAdmin).length,
        healthChecks: health.checks.map(check => ({
          name: check.name,
          status: check.status,
          responseTime: check.responseTime
        }))
      },
      logs: {
        total: logStats.total,
        byLevel: logStats.byLevel,
        byModule: logStats.byModule
      }
    };
    
    res.json(metrics);
  } catch (error) {
    logger.error('Failed to get metrics', 'monitoring', { error });
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

/**
 * Limpar logs (requer admin)
 */
router.delete('/logs', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    logger.clearLogs();
    logger.info('Logs cleared by admin', 'monitoring', { 
      userId: req.user?.email 
    });
    
    res.json({ message: 'Logs cleared successfully' });
  } catch (error) {
    logger.error('Failed to clear logs', 'monitoring', { error });
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

/**
 * Forçar health check
 */
router.post('/health/check', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    logger.info('Manual health check triggered', 'monitoring', { 
      userId: req.user?.email 
    });
    
    const health = await healthChecker.runHealthChecks();
    
    res.json({
      message: 'Health check completed',
      result: health
    });
  } catch (error) {
    logger.error('Manual health check failed', 'monitoring', { error });
    res.status(500).json({ error: 'Health check failed' });
  }
});

export default router;
