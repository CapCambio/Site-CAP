import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencyCode: string;
  currencyName: string;
}

interface CreateAlertData {
  email: string;
  currencyCode: string;
  limite: number;
  tipo: 'subida' | 'descida' | 'ambas';
}

export function AlertModal({ isOpen, onClose, currencyCode, currencyName }: AlertModalProps) {
  const [limite, setLimite] = useState("2");
  const [tipo, setTipo] = useState<'subida' | 'descida' | 'ambas'>('ambas');
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
      toast({
        title: "Alerta criado",
        description: `Você será notificado quando ${currencyName} variar ${limite}% ou mais.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts', user?.email] });
      onClose();
      setLimite("2");
      setTipo('ambas');
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o alerta. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async () => {
    if (!user?.email) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar alertas.",
        variant: "destructive"
      });
      return;
    }

    const limiteNum = parseFloat(limite);
    if (isNaN(limiteNum) || limiteNum <= 0) {
      toast({
        title: "Erro",
        description: "Insira um limite válido maior que 0.",
        variant: "destructive"
      });
      return;
    }

    // Registrar notificações push se ainda não estiver registrado
    await registerPushNotifications();

    createAlertMutation.mutate({
      email: user.email,
      currencyCode,
      limite: limiteNum,
      tipo
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
            <Label htmlFor="limite">Limite de Variação (%)</Label>
            <Input
              id="limite"
              type="number"
              step="0.1"
              min="0.1"
              value={limite}
              onChange={(e) => setLimite(e.target.value)}
              placeholder="Ex: 2.5"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
            <p className="text-sm text-zinc-400">
              Você será notificado quando a variação atingir este percentual.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Alerta</Label>
            <Select value={tipo} onValueChange={(value: 'subida' | 'descida' | 'ambas') => setTipo(value)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="ambas">Subida ou Descida</SelectItem>
                <SelectItem value="subida">Apenas Subida</SelectItem>
                <SelectItem value="descida">Apenas Descida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-zinc-800 p-3 rounded border border-zinc-700">
            <p className="text-sm text-zinc-300">
              <strong>Como funciona:</strong><br/>
              • Você receberá email + notificação push<br/>
              • Alertas são verificados automaticamente<br/>
              • Baseado na variação em relação ao último preço
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
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