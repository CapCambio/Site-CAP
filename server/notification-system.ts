
import nodemailer from 'nodemailer';
import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface NotificationPreferences {
  email: string;
  enableEmailNotifications: boolean;
  enableBrowserNotifications: boolean;
  notificationTypes: {
    priceChanges: boolean;
    newCurrencies: boolean;
    systemUpdates: boolean;
  };
}

interface NotificationConfig {
  preferences: NotificationPreferences[];
  emailConfig: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
}

class NotificationSystem {
  private io: SocketIOServer | null = null;
  private emailTransporter: nodemailer.Transporter | null = null;
  private configPath = path.join(__dirname, 'config', 'notifications.json');

  constructor() {
    this.loadConfig();
    this.setupEmailTransporter();
  }

  // Inicializar WebSocket
  initializeWebSocket(server: Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      console.log('Cliente conectado ao sistema de notificações:', socket.id);

      socket.on('subscribe', (email: string) => {
        socket.join(`user:${email}`);
        console.log(`Usuário ${email} inscrito para notificações`);
      });

      socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
      });
    });
  }

  // Configurar transportador de email
  private setupEmailTransporter() {
    // Configuração padrão (você pode personalizar)
    const emailConfig = {
      host: 'smtp.gmail.com', // ou outro provedor
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
      }
    };

    if (emailConfig.auth.user && emailConfig.auth.pass) {
      this.emailTransporter = nodemailer.createTransporter(emailConfig);
    }
  }

  // Carregar configurações
  private loadConfig(): NotificationConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Erro ao carregar config de notificações:', error);
    }

    return {
      preferences: [],
      emailConfig: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: '', pass: '' }
      }
    };
  }

  // Salvar configurações
  private saveConfig(config: NotificationConfig) {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Erro ao salvar config de notificações:', error);
    }
  }

  // Registrar preferências do usuário
  updateUserPreferences(email: string, preferences: Partial<NotificationPreferences>) {
    const config = this.loadConfig();
    const existingIndex = config.preferences.findIndex(p => p.email === email);

    const newPreferences: NotificationPreferences = {
      email,
      enableEmailNotifications: preferences.enableEmailNotifications ?? true,
      enableBrowserNotifications: preferences.enableBrowserNotifications ?? true,
      notificationTypes: {
        priceChanges: preferences.notificationTypes?.priceChanges ?? true,
        newCurrencies: preferences.notificationTypes?.newCurrencies ?? true,
        systemUpdates: preferences.notificationTypes?.systemUpdates ?? true,
      }
    };

    if (existingIndex >= 0) {
      config.preferences[existingIndex] = newPreferences;
    } else {
      config.preferences.push(newPreferences);
    }

    this.saveConfig(config);
  }

  // Enviar notificação híbrida
  async sendNotification(
    type: 'priceChanges' | 'newCurrencies' | 'systemUpdates',
    title: string,
    message: string,
    data?: any
  ) {
    const config = this.loadConfig();
    const recipients = config.preferences.filter(p => 
      p.notificationTypes[type]
    );

    for (const recipient of recipients) {
      // Notificação em tempo real (WebSocket)
      if (recipient.enableBrowserNotifications && this.io) {
        this.io.to(`user:${recipient.email}`).emit('notification', {
          type,
          title,
          message,
          data,
          timestamp: new Date().toISOString()
        });
      }

      // Notificação por email
      if (recipient.enableEmailNotifications && this.emailTransporter) {
        try {
          await this.sendEmail(recipient.email, title, message, data);
        } catch (error) {
          console.error(`Erro ao enviar email para ${recipient.email}:`, error);
        }
      }
    }
  }

  // Enviar email
  private async sendEmail(to: string, subject: string, message: string, data?: any) {
    if (!this.emailTransporter) return;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f3b234, #e09f28); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">CAP Cotações</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #333;">${subject}</h2>
          <p style="color: #666; line-height: 1.6;">${message}</p>
          ${data ? `<div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <pre style="margin: 0; font-size: 12px;">${JSON.stringify(data, null, 2)}</pre>
          </div>` : ''}
        </div>
        <div style="padding: 15px; text-align: center; background: #333; color: white;">
          <p style="margin: 0; font-size: 12px;">
            Para cancelar essas notificações, <a href="#" style="color: #f3b234;">clique aqui</a>
          </p>
        </div>
      </div>
    `;

    await this.emailTransporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: `[CAP Cotações] ${subject}`,
      html: htmlContent
    });
  }

  // Remover usuário das notificações
  unsubscribeUser(email: string) {
    const config = this.loadConfig();
    config.preferences = config.preferences.filter(p => p.email !== email);
    this.saveConfig(config);
  }

  // Obter preferências do usuário
  getUserPreferences(email: string): NotificationPreferences | null {
    const config = this.loadConfig();
    return config.preferences.find(p => p.email === email) || null;
  }
}

export const notificationSystem = new NotificationSystem();
