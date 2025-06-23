
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, Mail, Monitor } from 'lucide-react';

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

interface NotificationSettingsProps {
  userEmail: string;
}

export function NotificationSettings({ userEmail }: NotificationSettingsProps) {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: userEmail,
    enableEmailNotifications: true,
    enableBrowserNotifications: true,
    notificationTypes: {
      priceChanges: true,
      newCurrencies: true,
      systemUpdates: true,
    }
  });
  const [loading, setLoading] = useState(false);

  // Carregar preferências do usuário
  useEffect(() => {
    loadPreferences();
  }, [userEmail]);

  const loadPreferences = async () => {
    try {
      const response = await fetch(`/api/notifications/preferences/${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
    }
  };

  const savePreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          preferences
        })
      });

      if (response.ok) {
        toast({
          title: "Preferências salvas",
          description: "Suas configurações de notificação foram atualizadas.",
        });
      } else {
        throw new Error('Erro ao salvar preferências');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeAll = async () => {
    if (!confirm('Tem certeza que deseja cancelar todas as notificações?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail })
      });

      if (response.ok) {
        setPreferences(prev => ({
          ...prev,
          enableEmailNotifications: false,
          enableBrowserNotifications: false,
          notificationTypes: {
            priceChanges: false,
            newCurrencies: false,
            systemUpdates: false,
          }
        }));

        toast({
          title: "Notificações canceladas",
          description: "Todas as notificações foram desativadas.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível cancelar as notificações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testNotification = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail })
      });

      if (response.ok) {
        toast({
          title: "Notificação de teste enviada",
          description: "Verifique seu email e/ou navegador.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a notificação de teste.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Configurações de Notificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Canais de Notificação */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Canais de Notificação</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <Label htmlFor="email-notifications">Notificações por Email</Label>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.enableEmailNotifications}
              onCheckedChange={(checked) =>
                setPreferences(prev => ({ ...prev, enableEmailNotifications: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Monitor className="h-4 w-4" />
              <Label htmlFor="browser-notifications">Notificações no Navegador</Label>
            </div>
            <Switch
              id="browser-notifications"
              checked={preferences.enableBrowserNotifications}
              onCheckedChange={(checked) =>
                setPreferences(prev => ({ ...prev, enableBrowserNotifications: checked }))
              }
            />
          </div>
        </div>

        {/* Tipos de Notificação */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Tipos de Notificação</h3>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="price-changes">Mudanças de Preço (≥2%)</Label>
            <Switch
              id="price-changes"
              checked={preferences.notificationTypes.priceChanges}
              onCheckedChange={(checked) =>
                setPreferences(prev => ({
                  ...prev,
                  notificationTypes: { ...prev.notificationTypes, priceChanges: checked }
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="new-currencies">Novas Moedas</Label>
            <Switch
              id="new-currencies"
              checked={preferences.notificationTypes.newCurrencies}
              onCheckedChange={(checked) =>
                setPreferences(prev => ({
                  ...prev,
                  notificationTypes: { ...prev.notificationTypes, newCurrencies: checked }
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="system-updates">Atualizações do Sistema</Label>
            <Switch
              id="system-updates"
              checked={preferences.notificationTypes.systemUpdates}
              onCheckedChange={(checked) =>
                setPreferences(prev => ({
                  ...prev,
                  notificationTypes: { ...prev.notificationTypes, systemUpdates: checked }
                }))
              }
            />
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={savePreferences} disabled={loading} className="flex-1">
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
          
          <Button onClick={testNotification} variant="outline" disabled={loading}>
            Testar Notificação
          </Button>
          
          <Button onClick={unsubscribeAll} variant="destructive" disabled={loading}>
            <BellOff className="h-4 w-4 mr-2" />
            Cancelar Todas
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>• As notificações por email requerem configuração do servidor SMTP</p>
          <p>• As notificações no navegador funcionam apenas quando o site está aberto</p>
          <p>• Mudanças de preço significativas são consideradas ≥2% de variação</p>
        </div>
      </CardContent>
    </Card>
  );
}
