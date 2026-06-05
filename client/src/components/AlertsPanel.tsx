
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Trash2, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/http";
import { useTranslation } from "react-i18next";

interface UserAlert {
  limite?: number;
  tipo: 'subida' | 'descida' | 'valor-especifico';
  valor?: number;
  validade?: string | null;
  ativo: boolean;
  condicaoValor?: 'acima' | 'abaixo'; // NOVO
}

interface UserAlerts {
  email: string;
  alerts: { [currencyCode: string]: UserAlert };
}

interface AlertsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlertsPanel({ isOpen, onClose }: AlertsPanelProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Impedir scroll do body quando o painel está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  const { data: userAlerts, isLoading } = useQuery<UserAlerts>({
    queryKey: ['/api/alerts', user?.email],
    queryFn: async () => {
      if (!user?.email) return { email: '', alerts: {} };
      return api.alerts.getUserAlerts(user.email);
    },
    enabled: !!user?.email && isOpen
  });

  const removeAlertMutation = useMutation({
    mutationFn: async ({ currencyCode }: { currencyCode: string }) => {
      return api.alerts.removeAlert(user?.email || '', currencyCode);
    },
    onSuccess: (_, { currencyCode }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts', user?.email] });
    },
    onError: () => {
      toast({
        title: t('toasts.error'),
        description: t('toasts.errorRemoveAlertPanel'),
        variant: "destructive"
      });
    }
  });

  const handleRemoveAlert = (currencyCode: string) => {
    removeAlertMutation.mutate({ currencyCode });
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'subida':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'descida':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Bell className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getTipoLabel = (tipo: string, alert?: UserAlert) => {
    switch (tipo) {
      case 'subida':
        return t('admin.alwaysRise');
      case 'descida':
        return t('admin.alwaysFall');
      case 'valor-especifico':
        return `${t('admin.whenReach')}: R$ ${alert?.valor?.toFixed(2) || '0,00'}`;
      default:
        return t('admin.alertBothCases');
    }
  };

  const getValidadeLabel = (alert: UserAlert) => {
    // Alertas de valor específico não têm data de validade - somem quando disparados
    if (alert.tipo === 'valor-especifico') {
      return '';
    }
    
    if (!alert.validade) {
      return t('admin.indefiniteTime');
    }
    const date = new Date(alert.validade);
    return `${t('admin.until')} ${date.toLocaleDateString('pt-BR')}`;
  };

  if (!isOpen) return null;

  const alertsArray = userAlerts?.alerts ? Object.entries(userAlerts.alerts) : [];

  return (
    <div className="fixed inset-0 z-50 bg-black text-white overflow-y-auto">
      <div className="min-h-full">
        {/* Header */}
        <header className="border-b border-yellow-500/20 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto flex justify-between items-center h-16 px-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={onClose}
                className="text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-white">{t('alertsPanel.myAlerts')}</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-zinc-300 hidden sm:block">
                {t('alertsPanel.helloUser', { name: user?.name || user?.email || t('header.userFallback') })}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto py-4 sm:py-8 px-4">
          {/* Card principal */}
          <Card className="bg-zinc-900 border-yellow-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">{t('alertsPanel.myAlertsConfigured')}</h3>
                  <p className="text-sm text-zinc-400">
                    {t('alertsPanel.alertsCount', { count: alertsArray.length })}
                  </p>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                  <p className="text-zinc-400">{t('alertsPanel.loadingAlerts')}</p>
                </div>
              ) : alertsArray.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">{t('alertsPanel.noAlertsConfigured')}</h3>
                  <p className="text-zinc-400 mb-6">
                    {t('alertsPanel.noAlertsDesc')}
                  </p>
                  <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700 text-left max-w-lg mx-auto">
                    <p className="text-sm text-zinc-300 mb-3 font-medium">
                      {t('alertsPanel.createAlertStep1')}
                    </p>
                    <ol className="text-sm text-zinc-400 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="bg-yellow-500 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                        {t('alertsPanel.createAlertStep1')}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-yellow-500 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                        {t('alertsPanel.createAlertStep2')}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-yellow-500 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                        {t('alertsPanel.createAlertStep3')}
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-yellow-500 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                        {t('alertsPanel.createAlertStep4')}
                      </li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertsArray.map(([currencyCode, alert]) => (
                    <div
                      key={currencyCode}
                      className="p-4 bg-zinc-800 rounded-lg"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4">
                        {/* Layout para mobile */}
                        <div className="sm:hidden">
                          {/* Primeira linha: Informações da moeda e botões */}
                          <div className="flex justify-between items-start gap-3">
                            {/* Nome da moeda */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {getTipoIcon(alert.tipo)}
                              <div className="min-w-0">
                                <h4 className="font-medium text-white text-lg">{currencyCode}</h4>
                                <p className="text-sm text-zinc-400 whitespace-nowrap">
                                  {t(`currencies.${currencyCode}`) || t('history.currency')}
                                </p>
                                {/* Data de validade no mobile - abaixo do nome da moeda */}
                                <div className="mt-1">
                                  <span className="text-xs text-zinc-400">
                                    {getValidadeLabel(alert)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Tipo de alerta e botão de deletar */}
                            <div className="flex flex-col items-end">
                              <Badge 
                                variant="outline" 
                                className="text-zinc-300 border-zinc-500 whitespace-nowrap mt-1"
                              >
                                {getTipoLabel(alert.tipo, alert)}
                              </Badge>
                              <div className="mt-6">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveAlert(currencyCode)}
                                  disabled={removeAlertMutation.isPending}
                                  className="h-8 w-8 p-0 hover:bg-red-600 text-red-400 hover:text-white"
                                  title={t('admin.removeAlert')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Layout para desktop (oculto no mobile) */}
                        {/* Coluna da esquerda - Informações da moeda */}
                        <div className="hidden sm:flex items-center gap-3 min-w-0">
                          {getTipoIcon(alert.tipo)}
                          <div className="min-w-0">
                            <h4 className="font-medium text-white text-lg">{currencyCode}</h4>
                            <p className="text-sm text-zinc-400">
                              {t(`currencies.${currencyCode}`) || t('history.currency')}
                            </p>
                          </div>
                        </div>
                        
                        {/* Coluna do meio - Tipo de alerta (apenas desktop) */}
                        <div className="hidden sm:flex justify-center">
                          <Badge 
                            variant="outline" 
                            className="text-zinc-300 border-zinc-500 whitespace-nowrap justify-self-center"
                          >
                            {getTipoLabel(alert.tipo, alert)}
                          </Badge>
                        </div>
                        
                        {/* Coluna da direita - Data e botão de deletar (apenas desktop) */}
                        <div className="hidden sm:flex items-center justify-end gap-4 mt-1">
                          <div className="min-w-[120px]">
                            <span className="text-xs sm:text-sm text-zinc-400 whitespace-nowrap text-right block w-full">
                              {getValidadeLabel(alert)}
                            </span>
                          </div>
                          <div className="flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveAlert(currencyCode)}
                              disabled={removeAlertMutation.isPending}
                              className="h-8 w-8 p-0 hover:bg-red-600 text-red-400 hover:text-white"
                              title={t('admin.removeAlert')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Informações sobre alertas */}
                  <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                    <div className="flex items-start gap-3 text-sm">
                      <Bell className="h-5 w-5 mt-0.5 flex-shrink-0 text-yellow-400" />
                      <div className="text-zinc-300">
                        <h4 className="font-medium text-white mb-2">{t('alertsPanel.aboutNotifications')}</h4>
                        <ul className="space-y-2 text-sm">
                          <li>• {t('alertsPanel.notificationEmail')}</li>
                          <li>• {t('alertsPanel.notificationPush')}</li>
                          <li>• {t('alertsPanel.notificationInstall')}</li>
                          <li>• {t('alertsPanel.notificationTroubleshoot')}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
