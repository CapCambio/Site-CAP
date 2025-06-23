import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Trash2, TrendingUp, TrendingDown, Plus } from "lucide-react";
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

export function AlertsPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userAlerts, isLoading } = useQuery<UserAlerts>({
    queryKey: ['/api/alerts', user?.email],
    queryFn: async () => {
      if (!user?.email) return { email: '', alerts: {} };
      const response = await fetch(`/api/alerts/${user.email}`);
      return response.json();
    },
    enabled: !!user?.email
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

  if (isLoading) {
    return (
      <Card className="border-yellow-500/20 bg-zinc-900 text-white">
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Meus Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-400">Carregando alertas...</p>
        </CardContent>
      </Card>
    );
  }

  const alertsArray = userAlerts?.alerts ? Object.entries(userAlerts.alerts) : [];

  return (
    <Card className="border-yellow-500/20 bg-zinc-900 text-white">
      <CardHeader>
        <CardTitle className="text-yellow-400 flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Meus Alertas ({alertsArray.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alertsArray.length === 0 ? (
          <div className="text-center py-6">
            <Bell className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 mb-2">Nenhum alerta configurado</p>
            <p className="text-sm text-zinc-500">
              Clique no ícone <Bell className="h-4 w-4 inline mx-1" /> em qualquer moeda para criar um alerta
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alertsArray.map(([currencyCode, alert]) => (
              <div
                key={currencyCode}
                className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getTipoIcon(alert.tipo)}
                    <span className="font-medium text-white">{currencyCode}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                      {alert.limite}%
                    </Badge>
                    <Badge variant="outline" className="text-zinc-300 border-zinc-500">
                      {getTipoLabel(alert.tipo)}
                    </Badge>
                  </div>
                </div>
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
            ))}
            
            <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <div className="flex items-start gap-2 text-sm text-zinc-400">
                <Bell className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-zinc-300 mb-1">Como funcionam os alertas:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Você recebe email + notificação push</li>
                    <li>• Verificação automática a cada atualização</li>
                    <li>• Baseado na variação percentual</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}