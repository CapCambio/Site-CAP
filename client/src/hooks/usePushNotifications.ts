import { useState, useEffect } from "react";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { useTranslation } from "react-i18next";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function syncPushSubscriptionWithServer(
  email: string,
  subscription: PushSubscription
): Promise<boolean> {
  const registerResponse = await fetch("/api/alerts/register-push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, subscription }),
  });
  return registerResponse.ok;
}

export function usePushNotifications() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Verificar suporte
    const supported = "serviceWorker" in navigator && "Notification" in window && 'PushManager' in window;
    setIsSupported(supported);
    
    if (supported && user?.email) {
      // Verificar permissão atual
      if (Notification.permission === 'default') {
        // Pedir permissão automaticamente ao entrar na página
        setTimeout(() => {
          requestPermission();
        }, 2000); // Esperar 2 segundos para não incomodar na entrada
      } else if (Notification.permission === 'granted') {
        // Se já tem permissão, verificar subscription
        checkSubscription();
      }
      
      // Verificar permissões quando o usuário voltar para a página
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          checkSubscription();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [user?.email]);

  const checkSubscription = async () => {
    try {
      // Primeiro verifica se já tem permissão
      if (Notification.permission === 'granted') {
        // Tenta registrar o service worker se ainda não estiver registrado
        let registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          registration = await navigator.serviceWorker.register('/sw.js');
          await navigator.serviceWorker.ready;
        }
        
        // Verifica se já tem uma assinatura ativa
        const subscription = await registration.pushManager.getSubscription();
        if (subscription && user?.email) {
          await syncPushSubscriptionWithServer(user.email, subscription);
        }
        setIsSubscribed(!!subscription);
      } else {
        // Se não tem permissão, não está inscrito
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error("Erro ao verificar subscription:", error);
      setIsSubscribed(false);
    }
  };

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: t('toasts.notSupported'),
        description: t('toasts.notSupportedDesc'),
        variant: "destructive"
      });
      return false;
    }
    
    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      
      if (permission !== "granted") {
        // Não exibir mais o toast quando o usuário nega a permissão
        return false;
      }
      
      // Se concedeu permissão, fazer subscribe automaticamente
      if (user?.email) {
        await subscribe();
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const subscribe = async () => {
    if (!user?.email) {
      toast({
        title: t('toasts.error'),
        description: t('toasts.errorNotLoggedInPush'),
        variant: "destructive"
      });
      return false;
    }
    
    setIsLoading(true);
    try {
      // 1. Verificar se já está inscrito
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
      }

      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        const synced = await syncPushSubscriptionWithServer(user.email, existingSubscription);
        if (!synced) {
          throw new Error("Falha ao sincronizar inscrição push no servidor");
        }
        setIsSubscribed(true);
        return true;
      }
      
      // 2. Se não tem permissão, não pode continuar
      if (Notification.permission !== 'granted') {
        return false;
      }
      
      // 3. Obter chave VAPID
      const response = await fetch("/api/alerts/vapid-key");
      const { publicKey } = await response.json();
      if (!publicKey) {
        throw new Error("Chave VAPID pública indisponível");
      }
      
      // 4. Criar subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      
      // 6. Registrar no servidor
      const registerResponse = await fetch("/api/alerts/register-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          subscription
        })
      });
      
      if (!registerResponse.ok) {
        throw new Error("Falha ao registrar no servidor");
      }
      
      setIsSubscribed(true);
      
      toast({
        title: t('toasts.notificationsEnabled'),
        description: t('toasts.notificationsEnabledDesc'),
      });
      return true;
    } catch (error) {
      console.error("Erro ao ativar notificações:", error);
      toast({
        title: t('toasts.error'),
        description: t('toasts.errorEnablePush'),
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    requestPermission
  };
}
