import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import { useTranslation } from "react-i18next";

export function NotificationStatus() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'granted' | 'denied' | 'default'>('default');

  useEffect(() => {
    // Verificar o status da permissão de notificação
    const checkNotificationPermission = () => {
      if (!('Notification' in window)) {
        console.log('Este navegador não suporta notificações push');
        return;
      }
      
      // Verificar o status atual da permissão
      if (Notification.permission === 'granted') {
        setStatus('granted');
      } else if (Notification.permission === 'denied') {
        setStatus('denied');
      } else {
        setStatus('default');
      }
    };

    // Verificar o status inicial
    checkNotificationPermission();

    // Adicionar listener para mudanças no status da permissão
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkNotificationPermission();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (!('Notification' in window)) {
    return null; // Não mostrar nada se o navegador não suportar notificações
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {status === 'granted' ? (
        <>
          <Bell className="h-4 w-4 text-green-500" />
          <span className="text-green-500">{t('notificationPreferences.notificationsActive')}</span>
        </>
      ) : (
        <>
          <BellOff className="h-4 w-4 text-yellow-500" />
          <span className="text-yellow-500">
            {status === 'denied' ? t('notificationPreferences.notificationsBlocked') : t('notificationPreferences.notificationsInactive')}
          </span>
        </>
      )}
    </div>
  );
}
