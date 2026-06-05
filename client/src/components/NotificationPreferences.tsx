import { useState, useEffect } from 'react';
import { notificationService } from '../lib/notificationService';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

type NotificationType = 'priceAlert' | 'news' | 'updates';

interface NotificationPreferences {
  enabled: boolean;
  types: {
    [key in NotificationType]: boolean;
  };
  frequency: 'realtime' | 'hourly' | 'daily';
}

export function NotificationPreferences() {
  const { t } = useTranslation();
  const [isSupported, setIsSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: false,
    types: {
      priceAlert: true,
      news: true,
      updates: true,
    },
    frequency: 'realtime',
  });

  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);
      
      if (supported) {
        await loadPreferences();
      }
      
      setIsLoading(false);
    };
    
    checkSupport();
  }, []);

  const loadPreferences = async () => {
    try {
      // Carrega preferências do localStorage
      const savedPrefs = localStorage.getItem('notificationPreferences');
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
      
      // Verifica se já está inscrito
      const isSubscribed = await notificationService.isSubscribed();
      setPreferences(prev => ({
        ...prev,
        enabled: isSubscribed,
      }));
    } catch (error) {
      console.error(t('notificationPreferences.errorLoadPreferences'), error);
      toast.error(t('notificationPreferences.errorLoadPreferences'));
    }
  };

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      // Salva no estado local
      setPreferences(newPreferences);
      
      // Salva no localStorage
      localStorage.setItem('notificationPreferences', JSON.stringify(newPreferences));
      
      // Atualiza a inscrição se necessário
      if (newPreferences.enabled) {
        await handleSubscribe();
      } else {
        await handleUnsubscribe();
      }
      
      toast.success(t('notificationPreferences.preferencesSaved'));
    } catch (error) {
      console.error(t('notificationPreferences.errorSavePreferences'), error);
      toast.error(t('notificationPreferences.errorSavePreferences'));
    }
  };

  const handleSubscribe = async () => {
    try {
      // Solicita permissão
      const permission = await notificationService.requestPermission();
      
      if (permission !== 'granted') {
        throw new Error(t('notificationPreferences.permissionNotGranted'));
      }
      
      // Realiza a inscrição
      // TODO: Substituir 'current-user-id' pelo ID real do usuário
      await notificationService.subscribeToPushNotifications('current-user-id');
      
      return true;
    } catch (error) {
      console.error(t('notificationPreferences.errorEnableNotifications'), error);
      toast.error(t('notificationPreferences.errorEnableNotifications'));
      return false;
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await notificationService.unsubscribeFromPushNotifications();
      return true;
    } catch (error) {
      console.error(t('notificationPreferences.errorDisableNotifications'), error);
      toast.error(t('notificationPreferences.errorDisableNotifications'));
      return false;
    }
  };

  const toggleNotificationType = (type: NotificationType) => {
    const newPreferences = {
      ...preferences,
      types: {
        ...preferences.types,
        [type]: !preferences.types[type],
      },
    };
    savePreferences(newPreferences);
  };

  const toggleNotifications = async () => {
    const newEnabled = !preferences.enabled;
    const newPreferences = {
      ...preferences,
      enabled: newEnabled,
    };
    
    if (newEnabled) {
      // Se está ativando, tenta pedir permissão primeiro
      const permission = await notificationService.requestPermission();
      if (permission !== 'granted') {
        newPreferences.enabled = false;
        toast.error(t('notificationPreferences.needPermission'));
      }
    }
    
    savePreferences(newPreferences);
  };

  const changeFrequency = (frequency: 'realtime' | 'hourly' | 'daily') => {
    savePreferences({
      ...preferences,
      frequency,
    });
  };

  if (isLoading) {
    return <div>{t('notificationPreferences.loadingPreferences')}</div>;
  }

  if (!isSupported) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>{t('notificationPreferences.notificationsTitle')}</CardTitle>
          <CardDescription>
            {t('notificationPreferences.notSupportedDesc')}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t('notificationPreferences.preferencesTitle')}</CardTitle>
        <CardDescription>
          {t('notificationPreferences.preferencesDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="notifications-enabled">{t('notificationPreferences.activateNotifications')}</Label>
            <p className="text-sm text-muted-foreground">
              {preferences.enabled 
                ? t('notificationPreferences.notificationsActive') 
                : t('notificationPreferences.notificationsInactive')}
            </p>
          </div>
          <Switch
            id="notifications-enabled"
            checked={preferences.enabled}
            onCheckedChange={toggleNotifications}
          />
        </div>
        
        {preferences.enabled && (
          <>
            <div className="space-y-4">
              <Label>{t('notificationPreferences.notificationTypes')}</Label>
              <div className="space-y-3">
                {Object.entries(preferences.types).map(([type, enabled]) => (
                  <div key={type} className="flex items-center justify-between">
                    <Label htmlFor={`notify-${type}`} className="capitalize">
                      {type.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <Switch
                      id={`notify-${type}`}
                      checked={enabled}
                      onCheckedChange={() => toggleNotificationType(type as NotificationType)}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{t('notificationPreferences.frequency')}</Label>
              <div className="flex gap-2">
                {(['realtime', 'hourly', 'daily'] as const).map((freq) => (
                  <Button
                    key={freq}
                    variant={preferences.frequency === freq ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => changeFrequency(freq)}
                    className="capitalize"
                  >
                    {freq === 'realtime' ? t('notificationPreferences.realtime') : freq === 'hourly' ? t('notificationPreferences.hourly') : t('notificationPreferences.daily')}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
        
        <div className="pt-2 text-xs text-muted-foreground">
          <p>{t('notificationPreferences.settingsAuto')}</p>
          <p>{t('notificationPreferences.settingsAuto2')}</p>
        </div>
      </CardContent>
    </Card>
  );
}
