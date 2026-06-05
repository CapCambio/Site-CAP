import { log } from '../utils/logger';

class NotificationService {
  private static instance: NotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private publicVapidKey: string = import.meta.env.VITE_VAPID_PUBLIC_KEY || 
    'BB7eyKCweCdPjAumMnKbYfwZJiStQoMvfaI5hI3ARkb8OaKNV83Smb14PCvrI2wAfbkJPnCRJXUxWnODlZ43pCc';

  private constructor() {
    // Configura o serviço
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      log('Service Worker e/ou Push API não são suportados neste navegador', 'warn');
      return;
    }
    
    this.init().catch(error => {
      log(`Falha ao inicializar o serviço de notificações: ${error}`, 'error');
    });
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async init(): Promise<void> {
    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      log('Service Worker registrado com sucesso');
      
      // Verifica se já existe uma inscrição ativa
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        log('Inscrição push já existe');
      }
    } catch (error) {
      log(`Falha ao registrar o Service Worker: ${error}`, 'error');
      throw error;
    }
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Este navegador não suporta notificações');
    }

    const permission = await Notification.requestPermission();
    log(`Permissão para notificações: ${permission}`);
    return permission;
  }

  public async subscribeToPushNotifications(userId: string): Promise<PushSubscription | null> {
    if (!this.registration) {
      throw new Error('Service Worker não está registrado');
    }

    try {
      // Verifica se já está inscrito
      let subscription = await this.registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Cria uma nova inscrição
        const applicationServerKey = this.urlBase64ToUint8Array(this.publicVapidKey);
        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource
        });
        
        // Envia a inscrição para o servidor
        await this.sendSubscriptionToServer(subscription, userId);
        log('Inscrição em notificações push realizada com sucesso');
      }
      
      return subscription;
    } catch (error) {
      log(`Erro ao se inscrever para notificações push: ${error}`, 'error');
      throw error;
    }
  }

  public async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!this.registration) {
      throw new Error('Service Worker não está registrado');
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromServer(subscription);
        log('Inscrição em notificações push removida com sucesso');
        return true;
      }
      return false;
    } catch (error) {
      log(`Erro ao cancelar inscrição em notificações push: ${error}`, 'error');
      throw error;
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription, userId: string): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar inscrição para o servidor');
      }

      log('Inscrição enviada para o servidor com sucesso');
    } catch (error) {
      log(`Erro ao enviar inscrição para o servidor: ${error}`, 'error');
      throw error;
    }
  }

  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao remover inscrição no servidor');
      }

      log('Inscrição removida do servidor com sucesso');
    } catch (error) {
      log(`Erro ao remover inscrição do servidor: ${error}`, 'error');
      throw error;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  public async getNotificationPermission(): Promise<NotificationPermission> {
    return Notification.permission;
  }

  public async isSubscribed(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }
    const subscription = await this.registration.pushManager.getSubscription();
    return subscription !== null;
  }
}

export const notificationService = NotificationService.getInstance();
