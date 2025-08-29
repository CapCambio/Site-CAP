import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencyCode: string;
  currencyName: string;
}

interface CreateAlertData {
  email: string;
  currencyCode: string;
  tipo: 'subida' | 'descida' | 'valor-especifico';
  valor?: number;
  validade?: string | null;
}

export function AlertModal({ isOpen, onClose, currencyCode, currencyName }: AlertModalProps) {
  const [tipo, setTipo] = useState<'subida' | 'descida' | 'valor-especifico'>('subida');
  const [valorEspecifico, setValorEspecifico] = useState("");
  const [tempoIndeterminado, setTempoIndeterminado] = useState(true);

  // Calcula a data de 1 mês à frente
  const getOneMonthAhead = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  };

  const [validade, setValidade] = useState(getOneMonthAhead());

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createAlertMutation = useMutation({
    mutationFn: async (data: CreateAlertData) => {
      const response = await fetch("/api/alerts/create", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      });
      if (!response.ok) throw new Error('Failed to create alert');
      return response.json();
    },
    onSuccess: () => {
      const tipoTexto = tipo === 'subida' ? 'subidas' : tipo === 'descida' ? 'descidas' : 'valor específico';
      const validadeTexto = tempoIndeterminado 
      ? 'por tempo indeterminado' 
      : `até ${new Date(validade).toLocaleDateString('pt-BR')}`;

    toast({
        title: "Alerta criado",
        description: `Você será notificado sobre ${tipoTexto} de ${currencyName} ${validadeTexto}.`,
        duration: 4000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts', user?.email] });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o alerta. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setTipo('subida');
    setValorEspecifico("");
    setValidade(getOneMonthAhead());
    setTempoIndeterminado(true);
  };

  const handleSubmit = async () => {
    if (!user?.email) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar alertas.",
        variant: "destructive"
      });
      return;
    }

    // Validação para valor específico
    if (tipo === 'valor-especifico') {
      const valor = parseFloat(valorEspecifico);
      if (isNaN(valor) || valor <= 0) {
        toast({
          title: "Erro",
          description: "Insira um valor válido maior que 0.",
          variant: "destructive"
        });
        return;
      }
    }

    // Validação de data
    if (!tempoIndeterminado && validade) {
      const dataValidade = new Date(validade);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      if (dataValidade < hoje) {
        toast({
          title: "Erro",
          description: "A data de validade deve ser futura.",
          variant: "destructive"
        });
        return;
      }
    }

    // Registrar notificações push se ainda não estiver registrado
    await registerPushNotifications();

    createAlertMutation.mutate({
      email: user.email,
      currencyCode,
      tipo,
      valor: tipo === 'valor-especifico' ? parseFloat(valorEspecifico) : undefined,
      validade: tempoIndeterminado ? null : (validade || null)
    });
  };

  const registerPushNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("Notification" in window)) {
      console.log("Push notifications não suportadas");
      return;
    }

    try {
      // Pedir permissão para notificações
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log("Permissão para notificações negada");
        return;
      }

      // Registrar service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Obter chave VAPID do servidor
      const response = await fetch('/api/alerts/vapid-key');
      const { publicKey } = await response.json();

      // Criar subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey
      });

      // Enviar subscription para o servidor
      await fetch("/api/alerts/register-push", {
        method: "POST",
        body: JSON.stringify({
          email: user?.email,
          subscription
        }),
        headers: { "Content-Type": "application/json" }
      });

      console.log("Push notifications registradas com sucesso");
    } catch (error) {
      console.error("Erro ao registrar push notifications:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-yellow-500/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-yellow-400">
            Criar Alerta para {currencyName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Alerta</Label>
            <Select value={tipo} onValueChange={(value: 'subida' | 'descida' | 'valor-especifico') => setTipo(value)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="subida" className="text-white focus:text-black hover:text-black">Subida</SelectItem>
                <SelectItem value="descida" className="text-white focus:text-black hover:text-black">Descida</SelectItem>
                <SelectItem value="valor-especifico" className="text-white focus:text-black hover:text-black">Valor Específico</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-zinc-400">
              Os alertas se baseiam no preço de venda da moeda.
            </p>
          </div>

          {tipo === 'valor-especifico' && (
            <div className="space-y-2">
              <Label htmlFor="valor">Valor Específico (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0.01"
                value={valorEspecifico}
                onChange={(e) => setValorEspecifico(e.target.value)}
                placeholder="Ex: 5.50"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
              <p className="text-sm text-zinc-400">
                Você será notificado quando o preço atingir este valor.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Os alertas devem durar até:</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="date"
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
                disabled={tempoIndeterminado}
                placeholder="dd/mm/aaaa"
                className="bg-zinc-800 border-zinc-700 text-white disabled:opacity-50 w-fit md:w-auto [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="tempo-indeterminado"
                  checked={tempoIndeterminado}
                  onChange={(e) => {
                    setTempoIndeterminado(e.target.checked);
                    if (!e.target.checked) {
                      setValidade(getOneMonthAhead());
                    }
                  }}
                  className="h-4 w-4 accent-yellow-500"
                />
                <Label htmlFor="tempo-indeterminado" className="text-sm">
                  Tempo indeterminado
                </Label>
              </div>
            </div>
          </div>

          <div className="bg-zinc-800 p-3 rounded border border-zinc-700">
            <p className="text-sm text-zinc-300">
              <strong>Como funciona:</strong><br/>
              • Você receberá email + notificação push<br/>
              • Alertas são verificados automaticamente<br/>
              • Baseado na variação do preço de venda<br/>
              • Você será notificado quando o preço atingir este valor.<br/>
              • Cada usuário pode configurar um alerta para cada moeda
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-zinc-600 text-black bg-white hover:bg-zinc-200 hover:text-black"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createAlertMutation.isPending}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            {createAlertMutation.isPending ? "Criando..." : "Criar Alerta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}