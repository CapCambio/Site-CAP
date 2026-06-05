import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import "./radio-styles.css";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { useTranslation } from "react-i18next";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencyCode: string;
  currencyName: string;
  currentSellPrice?: number | null;
}

interface CreateAlertData {
  email: string;
  currencyCode: string;
  tipo: 'subida' | 'descida' | 'valor-especifico';
  valor?: number;
  validade?: string | null;
  condicaoValor?: 'acima' | 'abaixo';
}

export function AlertModal({ 
  isOpen, 
  onClose, 
  currencyCode, 
  currencyName, 
  currentSellPrice 
}: AlertModalProps) {
  const { t } = useTranslation();
  const [tipo, setTipo] = useState<'subida' | 'descida' | 'valor-especifico'>('valor-especifico');
  const [valorEspecifico, setValorEspecifico] = useState('');

  // Calcula a data de 1 mês à frente
  const getOneMonthAhead = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  };

  // Calcula a data máxima (1 ano à frente)
  const getMaxDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  };

  const [validade, setValidade] = useState(getOneMonthAhead());

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createAlertMutation = useMutation({
    mutationFn: async (data: CreateAlertData) => {
      return http.post("/api/alerts/create", data);
    },
    onSuccess: () => {
      let description = '';
      
      if (tipo === 'valor-especifico' && valorEspecifico) {
        const condicao = parseFloat(valorEspecifico.replace(',', '.')) > (currentSellPrice || 0) ? 'acima' : 'abaixo';
        
        description = t('alerts.alertCreatedSpecific', { 
          currencyName, 
          condition: condicao, 
          value: valorEspecifico 
        });
      } else {
        const acao = tipo === 'subida' ? t('alerts.riseAction') : t('alerts.fallAction');
        const dataValidade = new Date(validade).toLocaleDateString('pt-BR');
        description = t('alerts.alertCreatedPeriod', { 
          currencyName, 
          action: acao, 
          date: dataValidade 
        });
      }

      toast({
        title: t('toasts.alertCreated'),
        description,
        duration: 4000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts', user?.email] });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: t('toasts.error'),
        description: t('toasts.errorCreateAlert'),
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setTipo('valor-especifico');
    setValorEspecifico('');
    setValidade(getOneMonthAhead());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.email) {
      toast({
        title: t('toasts.error'),
        description: t('toasts.errorNotLoggedIn'),
        variant: "destructive",
      });
      return;
    }

    const alertData: CreateAlertData = {
      email: user.email,
      currencyCode,
      tipo,
      validade: validade,
    };

    if (tipo === 'valor-especifico') {
      const valor = parseFloat(valorEspecifico.replace(',', '.'));
      if (isNaN(valor) || valor <= 0) {
        toast({
          title: t('toasts.invalidValue'),
          description: t('toasts.invalidValueDesc'),
          variant: "destructive",
        });
        return;
      }
      alertData.valor = valor;
      // Condição fixa como 'acima' pois o valor sempre será maior que o atual
      alertData.condicaoValor = 'acima';
    }

    createAlertMutation.mutate(alertData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 text-white border-zinc-800 max-h-[95vh] overflow-y-auto landscape:pt-12 [@media(orientation:landscape)_and_(max-width:768px)]:[--dialog-close-top:1rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {t('alerts.createAlert')} - {currencyName} ({currencyCode})
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>{t('alerts.alertType')}</Label>
            <Select value={tipo} onValueChange={(value: 'subida' | 'descida' | 'valor-especifico') => setTipo(value)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder={t('alerts.selectType')} />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="valor-especifico" className="text-white focus:text-black hover:text-black">{t('alerts.specificValue')}</SelectItem>
                <SelectItem value="subida" className="text-white focus:text-black hover:text-black">{t('alerts.rise')}</SelectItem>
                <SelectItem value="descida" className="text-white focus:text-black hover:text-black">{t('alerts.fall')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tipo === 'valor-especifico' && (
            <div className="space-y-2">
              <Label>{t('alerts.targetValue')}</Label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder={t('alerts.targetValuePlaceholder')}
                value={valorEspecifico}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValorEspecifico(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white w-full"
              />
            </div>
          )}

          {(tipo === 'subida' || tipo === 'descida') && (
            <div className="space-y-2">
              <div className="space-y-2">
                <Label className="text-white">{t('alerts.duration')}:</Label>
                <Input
                  type="date"
                  value={validade}
                  min={new Date().toISOString().split('T')[0]}
                  max={getMaxDate()}
                  className="bg-zinc-800 border-zinc-700 text-white w-fit"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const selectedDate = new Date(e.target.value);
                    const maxDate = new Date(getMaxDate());
                    
                    if (selectedDate > maxDate) {
                      setValidade(maxDate.toISOString().split('T')[0]);
                      toast({
                        title: t('toasts.dateAdjusted'),
                        description: t('toasts.dateAdjustedDesc'),
                        variant: "default",
                      });
                    } else {
                      setValidade(e.target.value);
                    }
                  }}
                />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-zinc-800 p-3 rounded border border-zinc-700">
              <p className="text-sm text-zinc-300">
                <strong>{t('alerts.howItWorks')}:</strong><br/>
                {t('alerts.howItWorksText1')}<br/>
                {t('alerts.howItWorksText2')}<br/>
                {t('alerts.howItWorksText3')}
                
                {tipo === 'valor-especifico' && (
                  <>
                    <br/>
                    <span>{t('alerts.specificValueText')}</span>
                    <br/>
                    {currentSellPrice && valorEspecifico && (
                      parseFloat(valorEspecifico.replace(',', '.')) > currentSellPrice ? (
                        <span>{t('alerts.specificValueAbove')}</span>
                      ) : (
                        <span>{t('alerts.specificValueBelow')}</span>
                      )
                    )}
                  </>
                )}
                
                {tipo === 'subida' && (
                  <>
                    <br/>
                    <span>{t('alerts.riseText', { currencyName })}</span>
                    <br/>
                    <span>{t('alerts.riseText2')}</span>
                  </>
                )}
                
                {tipo === 'descida' && (
                  <>
                    <br/>
                    <span>{t('alerts.fallText', { currencyName })}</span>
                    <br/>
                    <span>{t('alerts.fallText2')}</span>
                  </>
                )}
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-zinc-600 text-white bg-transparent hover:bg-zinc-800 hover:text-white"
              >
                {t('alerts.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={createAlertMutation.isPending}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                {createAlertMutation.isPending ? t('common.loading') : t('alerts.create')}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}