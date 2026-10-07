import { useState, useEffect, useRef } from "react";
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

function normalizeVapidKey(key: string): string {
  return key.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function applicationServerKeyToBase64Url(key: ArrayBuffer): string {
  const bytes = new Uint8Array(key);
  let binary = "";
  for (let i = 0; i < bytes.length; ++i) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

let cachedServerVapidKey: string | null = null;

async function getServerVapidKey(): Promise<string | null> {
  if (cachedServerVapidKey) return cachedServerVapidKey;
  try {
    const response = await fetch("/api/alerts/vapid-key");
    if (!response.ok) return null;
    const data = await response.json();
    if (typeof data?.publicKey === "string" && data.publicKey) {
      cachedServerVapidKey = data.publicKey;
    }
  } catch (error) {
    console.error("Erro ao obter chave VAPID do servidor:", error);
  }
  return cachedServerVapidKey;
}

// Assinatura criada com uma chave VAPID que o servidor já trocou é rejeitada para
// sempre (403 "as credenciais VAPID ... não corresponde"), mas o navegador continua
// devolvendo ela como se estivesse viva. Sem comparar a chave, cada carga do app
// re-registra a assinatura morta e o cliente fica mudo indefinidamente.
async function isOrphanSubscription(subscription: PushSubscription): Promise<boolean> {
  const storedKey = subscription.options?.applicationServerKey;
  if (!storedKey) return false;
  const currentKey = await getServerVapidKey();
  if (!currentKey) return false;
  return applicationServerKeyToBase64Url(storedKey) !== normalizeVapidKey(currentKey);
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
  const healAttempted = useRef(false);

  useEffect(() => {
    healAttempted.current = false;

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
        if (subscription && user?.email && !(await isOrphanSubscription(subscription))) {
          await syncPushSubscriptionWithServer(user.email, subscription);
          setIsSubscribed(true);
          return;
        }

        // Sem isto nada recria a assinatura: expirada (410) ou de chave antiga (403) o
        // cliente fica sem push para sempre, mesmo com a permissão concedida.
        if (healAttempted.current) {
          setIsSubscribed(false);
          return;
        }
        healAttempted.current = true;
        await subscribe({ silent: true });
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

  const subscribe = async (options?: { silent?: boolean }) => {
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
        if (!(await isOrphanSubscription(existingSubscription))) {
          const synced = await syncPushSubscriptionWithServer(user.email, existingSubscription);
          if (!synced) {
            throw new Error("Falha ao sincronizar inscrição push no servidor");
          }
          setIsSubscribed(true);
          return true;
        }
        // Descartar a assinatura órfã libera o navegador a emitir uma nova pela chave atual.
        await existingSubscription.unsubscribe();
      }
      
      // 2. Se não tem permissão, não pode continuar
      if (Notification.permission !== 'granted') {
        return false;
      }
      
      // 3. Obter chave VAPID
      const publicKey = await getServerVapidKey();
      if (!publicKey) {
        throw new Error("Chave VAPID pública indisponível");
      }
      
      // 4. Criar subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      
      // 6. Registrar no servidor
      const registered = await syncPushSubscriptionWithServer(user.email, subscription);

      if (!registered) {
        throw new Error("Falha ao registrar no servidor");
      }
      
      setIsSubscribed(true);

      if (!options?.silent) {
        toast({
          title: t('toasts.notificationsEnabled'),
        });
      }
      return true;
    } catch (error) {
      console.error("Erro ao ativar notificações:", error);
      if (!options?.silent) {
        toast({
          title: t('toasts.error'),
          description: t('toasts.errorEnablePush'),
          variant: "destructive"
        });
      }
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
