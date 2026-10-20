import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import "./radio-styles.css";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";

function getLocale(): string {
  const lang = i18n.language || 'pt';
  const localeMap: Record<string, string> = {
    'pt': 'pt-BR',
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR'
  };
  return localeMap[lang] || 'pt-BR';
}

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

interface ExistingAlert {
  tipo: 'subida' | 'descida' | 'valor-especifico';
  valor?: number;
  validade?: string | null;
  ativo: boolean;
  condicaoValor?: 'acima' | 'abaixo';
}

interface UserAlertsResponse {
  email: string;
  alerts: { [currencyCode: string]: ExistingAlert };
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

  // Alerta já existente para esta moeda (mesma cache do "Meus Alertas").
  // O servidor já impõe 1 por moeda (upsert), então recriar substitui; aqui só
  // avisamos o usuário antes de sobrescrever.
  const { data: alertsData } = useQuery<UserAlertsResponse>({
    queryKey: ['/api/alerts', user?.email],
    queryFn: () => http.get<UserAlertsResponse>(`/api/alerts/${user?.email}`),
    enabled: !!user?.email && isOpen
  });
  const existingAlert = alertsData?.alerts?.[currencyCode];

  const getTipoLabel = (tipo: ExistingAlert['tipo']) =>
    tipo === 'valor-especifico'
      ? t('alerts.specificValue')
      : tipo === 'subida'
      ? t('alerts.rise')
      : t('alerts.fall');

  // Payload aguardando confirmação de substituição (null = sem pendência).
  const [pendingSubmit, setPendingSubmit] = useState<{
    data: CreateAlertData;
    existingTipo: ExistingAlert['tipo'];
  } | null>(null);

  // Ao (re)abrir o modal, descarta qualquer confirmação pendente de uma sessão anterior.
  useEffect(() => {
    if (isOpen) setPendingSubmit(null);
  }, [isOpen]);

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
        // Mesma correção de fuso: extrai a parte da data e interpreta como local.
        const dateStr = validade.split('T')[0];
        const dataValidade = new Date(dateStr + 'T00:00:00').toLocaleDateString(getLocale());
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
    setPendingSubmit(null);
  };

  const buildAlertData = (): CreateAlertData | null => {
    if (!user?.email) {
      toast({
        title: t('toasts.error'),
        description: t('toasts.errorNotLoggedIn'),
        variant: "destructive",
      });
      return null;
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
        return null;
      }
      alertData.valor = valor;
      // Condição fixa como 'acima' pois o valor sempre será maior que o atual
      alertData.condicaoValor = 'acima';
    }

    return alertData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const alertData = buildAlertData();
    if (!alertData) return;

    // Já existe alerta para esta moeda → confirmar antes de substituir.
    if (existingAlert) {
      setPendingSubmit({ data: alertData, existingTipo: existingAlert.tipo });
      return;
    }

    createAlertMutation.mutate(alertData);
  };

  const confirmReplace = () => {
    if (pendingSubmit) createAlertMutation.mutate(pendingSubmit.data);
  };

  const cancelReplace = () => setPendingSubmit(null);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[500px] bg-zinc-900 text-white border-zinc-800 max-h-[90vh] overflow-y-auto alert-modal-scrollbar landscape:pt-12 [@media(orientation:landscape)_and_(max-width:768px)]:[--dialog-close-top:1rem]"
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(243, 178, 52, 0.3) rgba(0, 0, 0, 0.1)'
        }}
      >
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
                <strong>{t('alerts.howItWorks', { type: getTipoLabel(tipo) })}:</strong><br/>
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

    <AlertDialog open={!!pendingSubmit} onOpenChange={(open) => { if (!open) setPendingSubmit(null); }}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">{t('alerts.replaceExistingTitle')}</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            {t('alerts.replaceExistingWarning', {
              currencyName,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-zinc-600 text-white bg-transparent hover:bg-zinc-800">
            {t('alerts.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmReplace}
            disabled={createAlertMutation.isPending}
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            {createAlertMutation.isPending ? t('common.loading') : t('alerts.replaceConfirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}