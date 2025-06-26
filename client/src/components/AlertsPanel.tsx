
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Trash2, TrendingUp, TrendingDown, X, ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface UserAlert {
  limite: number;
  tipo: 'subida' | 'descida' | 'ambas';
  ativo: boolean;
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
  const { user, logout } = useAuth();
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
      const response = await fetch(`/api/alerts/${user.email}`);
      return response.json();
    },
    enabled: !!user?.email && isOpen
  });

  const removeAlertMutation = useMutation({
    mutationFn: async ({ currencyCode }: { currencyCode: string }) => {
      const response = await fetch(`/api/alerts/${user?.email}/${currencyCode}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error('Failed to remove alert');
      return response.json();
    },
    onSuccess: (_, { currencyCode }) => {
      toast({
        title: "Alerta removido",
        description: `Alerta para ${currencyCode} foi removido com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts', user?.email] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover o alerta.",
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

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'subida':
        return 'Subida';
      case 'descida':
        return 'Descida';
      default:
        return 'Ambas';
    }
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
              <h1 className="text-xl font-semibold text-white">Meus Alertas</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-zinc-300 hidden sm:block">
                Olá {user?.name || user?.email || 'Usuário'}
              </div>
              <button 
                onClick={logout}
                className="text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full p-2 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto py-4 sm:py-8 px-4">
          {/* Título e Descrição */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Gerenciar Alertas</h2>
              <p className="text-zinc-300 mt-1 text-sm sm:text-base">
                Visualize e gerencie todos os seus alertas de variação de moedas configurados.
              </p>
            </div>

            <div className="flex items-center space-x-2 text-zinc-300 mt-4 sm:mt-0">
              <Bell className="h-5 w-5" />
              <span className="text-sm sm:text-base">CAP Câmbio - Alertas</span>
            </div>
          </div>

          {/* Card principal */}
          <Card className="bg-zinc-900 border-yellow-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Meus Alertas Configurados</h3>
                  <p className="text-sm text-zinc-400">
                    {alertsArray.length} alerta(s) configurado(s)
                  </p>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                  <p className="text-zinc-400">Carregando alertas...</p>
                </div>
              ) : alertsArray.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Nenhum alerta configurado</h3>
                  <p className="text-zinc-400 mb-6">
                    Você ainda não possui alertas configurados para variações de moedas.
                  </p>
                  <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700 text-left max-w-lg mx-auto">
                    <p className="text-sm text-zinc-300 mb-3 font-medium">
                      Para criar um alerta:
                    </p>
                    <ol className="text-sm text-zinc-400 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="bg-yellow-500 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                        Volte para a página principal
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-yellow-500 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                        Clique no botão "Criar alerta" <Bell className="h-4 w-4 inline mx-1" /> em qualquer moeda
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-yellow-500 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                        Configure o tipo e limite de variação desejado
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-yellow-500 text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                        Confirme a criação do alerta
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
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            {getTipoIcon(alert.tipo)}
                            <div className="min-w-0">
                              <h4 className="font-medium text-white text-lg">{currencyCode}</h4>
                              <p className="text-sm text-zinc-400">Moeda monitorada</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-3 items-center flex-wrap">
                            <div className="text-center">
                              <Badge variant="outline" className="text-yellow-400 border-yellow-400 mb-1">
                                {alert.limite}%
                              </Badge>
                              <p className="text-xs text-zinc-500">Limite</p>
                            </div>
                            
                            <div className="text-center">
                              <Badge variant="outline" className="text-zinc-300 border-zinc-500 mb-1">
                                {getTipoLabel(alert.tipo)}
                              </Badge>
                              <p className="text-xs text-zinc-500">Tipo</p>
                            </div>
                            
                            <div className="text-center">
                              <Badge 
                                variant="outline" 
                                className={alert.ativo ? "text-green-400 border-green-400 mb-1" : "text-red-400 border-red-400 mb-1"}
                              >
                                {alert.ativo ? "Ativo" : "Inativo"}
                              </Badge>
                              <p className="text-xs text-zinc-500">Status</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end">
                          <span className="text-xs sm:text-sm text-zinc-400 mr-4">
                            Configurado para {user?.name || user?.email}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveAlert(currencyCode)}
                            disabled={removeAlertMutation.isPending}
                            className="h-8 w-8 p-0 hover:bg-red-600 text-red-400 hover:text-white"
                            title="Remover alerta"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Informações sobre alertas */}
                  <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                    <div className="flex items-start gap-3 text-sm">
                      <Bell className="h-5 w-5 mt-0.5 flex-shrink-0 text-yellow-400" />
                      <div className="text-zinc-300">
                        <h4 className="font-medium text-white mb-2">Como funcionam os alertas:</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• <strong>Email + Push:</strong> Você receberá notificações por email e push no navegador</li>
                          <li>• <strong>Verificação automática:</strong> Alertas são verificados a cada atualização de cotação</li>
                          <li>• <strong>Baseado em variação:</strong> Comparamos o preço atual com o anterior</li>
                          <li>• <strong>Tipos de alerta:</strong> Subida, descida ou ambas as direções</li>
                          <li>• <strong>Limite personalizado:</strong> Configure a porcentagem de variação desejada</li>
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
