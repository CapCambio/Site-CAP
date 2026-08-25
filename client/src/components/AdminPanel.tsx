
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Settings, Search, Trash2, LogOut, Edit, Bell, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface AuthorizedEmail {
  email: string;
  name: string;
  isAdmin: boolean;
  lastAccess?: string;
}

interface AlertsManagementProps {
  authorizedEmails: AuthorizedEmail[];
}

interface AdminPanelProps {
  onClose: () => void;
}

// Componente para mostrar alertas de um usuário específico
const UserAlerts: React.FC<{ email: string }> = ({ email }) => {
  const { t } = useTranslation();
  const [userAlerts, setUserAlerts] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  const removeAlert = async (currencyCode: string) => {
    try {
      const response = await fetch(`/api/alerts/${email}/${currencyCode}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Remover do estado local
        setUserAlerts((prev: any) => {
          const newAlerts = { ...prev };
          delete newAlerts[currencyCode];
          return newAlerts;
        });
        console.log(`Alerta ${currencyCode} removido com sucesso`);
      } else {
        console.error('Erro ao remover alerta:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao remover alerta:', error);
    }
  };

  useEffect(() => {
    const loadUserAlerts = async () => {
      console.log('Carregando alertas para o usuário:', email);
      try {
        const response = await fetch(`/api/alerts/${email}`);
        console.log('Response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Dados recebidos:', data);
          setUserAlerts(data.alerts || {});
        } else {
          console.error('Erro na resposta:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Erro ao carregar alertas do usuário:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserAlerts();
  }, [email]);

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

  const getTipoLabel = (tipo: string, alert: any) => {
    switch (tipo) {
      case 'subida':
        return t('admin.alwaysRise');
      case 'descida':
        return t('admin.alwaysFall');
      case 'valor-especifico':
        // Verificar tanto 'valor' quanto 'valorEspecifico' para compatibilidade
        const valor = typeof alert?.valor === 'number' ? alert.valor :
                      typeof alert?.valorEspecifico === 'number' ? alert.valorEspecifico :
                      '0,00';
        const valorFormatado = typeof valor === 'number' ? valor.toFixed(2) : valor;
        return `${t('admin.whenReach')}: R$ ${valorFormatado}`;
      default:
        return t('admin.alertBothCases');
    }
  };

  const getValidadeLabel = (alert: any) => {
    if (alert.tipo === 'valor-especifico') {
      return '';
    }

    if (!alert.validade) {
      return t('admin.indefiniteTime');
    }
    const date = new Date(alert.validade);
    return `${t('admin.until')} ${date.toLocaleDateString('pt-BR')}`;
  };

  if (isLoading) {
    return <div className="text-center py-4 text-zinc-400">{t('admin.loadingAlerts')}</div>;
  }

  const alertsCount = Object.keys(userAlerts).length;

  if (alertsCount === 0) {
    return (
      <div className="text-center py-4 text-zinc-400">
        <p className="text-sm">{t('admin.noAlertsConfigured')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(userAlerts).map(([currencyCode, alert]: [string, any]) => (
        <div
          key={currencyCode}
          className="p-4 bg-zinc-800 rounded-lg border border-zinc-700"
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
                      onClick={() => removeAlert(currencyCode)}
                      className="h-8 w-8 p-0 hover:bg-red-600 text-red-400 hover:text-white"
                      title={t('alerts.removeAlert')}
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
                  onClick={() => removeAlert(currencyCode)}
                  className="h-8 w-8 p-0 hover:bg-red-600 text-red-400 hover:text-white"
                  title={t('alerts.removeAlert')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

function AlertsManagement({ authorizedEmails }: AlertsManagementProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [allAlerts, setAllAlerts] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [alertStats, setAlertStats] = useState<any>({});
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const loadAllAlerts = async (page: number = currentPage) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/alerts/admin/all?page=${page}&limit=${itemsPerPage}`);
      if (response.ok) {
        const data = await response.json();
        setAllAlerts(data.alerts);
        setPagination(data.pagination);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlertStats = async () => {
    try {
      const response = await fetch(`/api/alerts/admin/stats?month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setAlertStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const removeAlert = async (email: string, currencyCode: string) => {
    try {
      const response = await fetch(`/api/alerts/${email}/${currencyCode}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        const userName = getUserName(email);
        toast({
          title: t('toasts.alertRemoved'),
          description: t('toasts.alertRemovedDesc', { currencyCode, userName })
        });
        const newTotal = pagination.total - 1;
        const newTotalPages = Math.ceil(newTotal / itemsPerPage);
        const pageToLoad = currentPage > newTotalPages ? Math.max(1, newTotalPages) : currentPage;
        loadAllAlerts(pageToLoad);
      }
    } catch (error) {
      console.error('Erro ao remover alerta:', error);
      toast({
        title: t('toasts.error'),
        description: t('toasts.errorRemoveAlert'),
        variant: "destructive"
      });
    }
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

  const getTipoLabel = (tipo: string, alert: any) => {
    switch (tipo) {
      case 'subida':
        return t('admin.alwaysRise');
      case 'descida':
        return t('admin.alwaysFall');
      case 'valor-especifico':
        // Verificar tanto 'valor' quanto 'valorEspecifico' para compatibilidade
        const valor = typeof alert?.valor === 'number' ? alert.valor :
                      typeof alert?.valorEspecifico === 'number' ? alert.valorEspecifico :
                      '0,00';
        const valorFormatado = typeof valor === 'number' ? valor.toFixed(2) : valor;
        return `${t('admin.whenReach')}: R$ ${valorFormatado}`;
      default:
        return t('admin.alertBothCases');
    }
  };

  const getValidadeLabel = (alert: any) => {
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

  const getUserName = (email: string) => {
    const user = authorizedEmails.find((user: AuthorizedEmail) => user.email === email);
    return user?.name || t('admin.noName');
  };

  // Filtrar alertas baseado no termo de busca
  const filteredAlerts = Object.entries(allAlerts).filter(([email, userData]: [string, any]) => {
    if (!searchTerm) return true;
    
    const userName = getUserName(email).toLowerCase();
    const emailLower = email.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return userName.includes(searchLower) || emailLower.includes(searchLower);
  });

  // Gerar lista dos últimos 12 meses
  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const value = `${year}-${month}`;
      
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const label = `${monthNames[date.getMonth()]} ${year}`;
      
      options.push({ value, label });
    }
    
    return options;
  };

  const getSelectedMonthLabel = () => {
    const selectedOption = monthOptions.find(option => option.value === selectedMonth);
    return selectedOption ? selectedOption.label : 'Este mês';
  };

  const monthOptions = generateMonthOptions();

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadAllAlerts(newPage);
    }
  };

  useEffect(() => {
    loadAllAlerts(1);
    loadAlertStats();
  }, []);

  useEffect(() => {
    loadAlertStats();
  }, [selectedMonth]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMonthDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.month-dropdown-card')) {
          setShowMonthDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMonthDropdown]);

  const usersWithAlerts = Object.entries(allAlerts).filter(([email, userData]: [string, any]) => 
    userData && userData.alerts && Object.keys(userData.alerts).length > 0
  );

  return (
    <Card className="bg-zinc-900 border-yellow-500/20 mt-6">
      <CardContent className="p-4 sm:p-6">
        {/* Painel de Estatísticas */}
        <div className="mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-400" />
            {t('admin.alertsSent')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Alertas Hoje */}
            <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">{t('admin.today')}</p>
                  <p className="text-2xl font-bold text-white">{alertStats.today || 0}</p>
                </div>
                <div className="bg-green-500/10 p-2 rounded-full">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </div>

            {/* Alertas no Mês - Dropdown Interativo */}
            <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 relative month-dropdown-card">
              <div className="flex items-center justify-between">
                <div>
                  <div 
                    className="text-sm text-zinc-400 mb-1 cursor-pointer hover:text-zinc-300 transition-colors flex items-center gap-1" 
                    onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                  >
                    {getSelectedMonthLabel()}
                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 mt-0.5 ${
                      showMonthDropdown ? 'rotate-180' : ''
                    }`} />
                  </div>
                  <p className="text-2xl font-bold text-white">{alertStats.month || 0}</p>
                </div>
                <div className="bg-blue-500/10 p-2 rounded-full">
                  <Bell className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              
              {/* Dropdown */}
              {showMonthDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-600 rounded-lg shadow-lg z-50">
                  <div className="max-h-60 overflow-y-auto">
                    {monthOptions.map((option) => (
                      <div
                        key={option.value}
                        className={`px-4 py-2 hover:bg-zinc-700 cursor-pointer transition-colors ${
                          selectedMonth === option.value ? 'bg-zinc-700 text-yellow-400' : 'text-white'
                        }`}
                        onClick={() => {
                          setSelectedMonth(option.value);
                          setShowMonthDropdown(false);
                        }}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Alertas */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-400" />
              {t('admin.userAlerts')}
            </h3>
            <p className="text-zinc-300 text-sm sm:text-base">
              {t('admin.userAlertsDesc')}
            </p>
            {!isLoading && pagination.total > 0 && (
              <p className="text-sm text-zinc-400 mt-1">
                {t('admin.pageOfUsers', { page: pagination.page, totalPages: pagination.totalPages, total: pagination.total })}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Input 
              type="text" 
              placeholder={t('admin.searchUsers')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 w-full sm:w-64"
            />
            <button className="text-zinc-300 hover:text-white transition-colors">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-zinc-400">{t('admin.loadingAlerts')}</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-white mb-2">
              {searchTerm ? t('admin.nameNotFound') : t('admin.noAlertsConfiguredAdmin')}
            </h4>
            <p className="text-zinc-400">
              {searchTerm 
                ? t('admin.noSearchResultsDesc')
                : t('admin.noSearchResultsDesc')
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map(([email, userData]: [string, any]) => (
              <div key={email}>
                {/* Header do usuário sem card */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-yellow-500/10 p-2 rounded-full">
                    <Bell className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-lg">{getUserName(email)}</h4>
                    <p className="text-sm text-zinc-400">{email}</p>
                    <p className="text-sm text-zinc-400">
                      {Object.keys(userData.alerts).length} {t('admin.alertsConfigured')}
                    </p>
                  </div>
                </div>

                {/* Cada alerta em seu próprio card */}
                <div className="space-y-3">
                  {Object.entries(userData.alerts).map(([currencyCode, alert]: [string, any]) => (
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
                                  onClick={() => removeAlert(email, currencyCode)}
                                  className="h-8 w-8 p-0 hover:bg-red-600 text-red-400 hover:text-white"
                                  title={t('alerts.removeAlert')}
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
                              onClick={() => removeAlert(email, currencyCode)}
                              className="h-8 w-8 p-0 hover:bg-red-600 text-red-400 hover:text-white"
                              title={t('alerts.removeAlert')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
            <div className="text-sm text-zinc-400">
              {t('admin.showingUsers', { 
                start: ((pagination.page - 1) * pagination.limit) + 1, 
                end: Math.min(pagination.page * pagination.limit, pagination.total), 
                total: pagination.total 
              })}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              >
                {t('admin.previous')}
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className={pageNum === pagination.page 
                        ? "bg-yellow-500 text-black hover:bg-yellow-600" 
                        : "border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                      }
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              >
                {t('admin.next')}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [authorizedEmails, setAuthorizedEmails] = useState<AuthorizedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editName, setEditName] = useState("");
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [showOnlyUsersWithAlerts, setShowOnlyUsersWithAlerts] = useState(false);
  const [showOnlyAdmins, setShowOnlyAdmins] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  // Impedir scroll do body quando o painel está aberto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Carregar emails autorizados
  useEffect(() => {
    loadAuthorizedEmails(1);
  }, []);

  const loadAuthorizedEmails = async (page: number = currentPage) => {
    try {
      const response = await fetch(`/api/admin/emails?page=${page}&limit=${itemsPerPage}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Dados recebidos da API:', data);
        
        const allEmails: AuthorizedEmail[] = data.emails.map((item: any) => ({
          email: item.email,
          name: item.name || t('admin.noName'),
          isAdmin: item.isAdmin || false,
          lastAccess: item.lastAccess || undefined
        }));

        console.log('Emails processados:', allEmails);
        setAuthorizedEmails(allEmails);
        setPagination(data.pagination);
        setCurrentPage(page);
      } else {
        console.error('Erro na resposta da API:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Erro ao carregar emails:', error);
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se os campos estão preenchidos
    if (!newEmail.trim() || !newName.trim()) {
      setShowValidationErrors(true);
      return;
    }

    setShowValidationErrors(false);
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: newEmail,
          name: newName,
          type: 'authorized' // Por padrão adiciona como usuário comum
        })
      });

      if (response.ok) {
        setNewEmail("");
        setNewName("");
        loadAuthorizedEmails(currentPage);
        toast({
          title: t('toasts.userAdded'),
          description: t('toasts.userAddedDesc', { name: newName, email: newEmail })
        });
      } else {
        toast({
          title: t('toasts.error'),
          description: t('toasts.errorAddUser'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao adicionar email:', error);
      toast({
        title: t('toasts.error'),
        description: t('toasts.errorAddUserDesc'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEmail = async (oldEmail: string) => {
    if (!editEmail.trim() || !editName.trim()) return;

    const emailToEdit = authorizedEmails.find(item => item.email === oldEmail);
    if (!emailToEdit) return;

    try {
      const response = await fetch('/api/admin/emails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          oldEmail,
          newEmail: editEmail,
          name: editName,
          type: emailToEdit.isAdmin ? 'admin' : 'authorized'
        })
      });

      if (response.ok) {
        setEditingEmail(null);
        setEditEmail("");
        setEditName("");
        loadAuthorizedEmails(currentPage);
      }
    } catch (error) {
      console.error('Erro ao editar email:', error);
    }
  };

  const handleRemoveEmail = async (email: string) => {
    const emailToRemove = authorizedEmails.find(item => item.email === email);
    if (!emailToRemove) return;

    try {
      const response = await fetch('/api/admin/emails', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          type: emailToRemove.isAdmin ? 'admin' : 'authorized'
        })
      });

      if (response.ok) {
        // Se a página atual ficou vazia após remoção, voltar para página anterior
        const newTotal = pagination.total - 1;
        const newTotalPages = Math.ceil(newTotal / itemsPerPage);
        const pageToLoad = currentPage > newTotalPages ? Math.max(1, newTotalPages) : currentPage;
        loadAuthorizedEmails(pageToLoad);
      }
    } catch (error) {
      console.error('Erro ao remover email:', error);
    }
  };

  const startEdit = (email: string, name: string) => {
    setEditingEmail(email);
    setEditEmail(email);
    setEditName(name);
  };

  const cancelEdit = () => {
    setEditingEmail(null);
    setEditEmail("");
    setEditName("");
  };

  const toggleUserExpanded = (email: string) => {
    console.log('Toggle user expanded:', email);
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(email)) {
        newSet.delete(email);
        console.log('Removendo da expansão:', email);
      } else {
        newSet.add(email);
        console.log('Adicionando à expansão:', email);
      }
      return newSet;
    });
  };

  const checkUserHasAlerts = async (email: string) => {
    try {
      const response = await fetch(`/api/alerts/${email}`);
      if (response.ok) {
        const data = await response.json();
        const alerts = data.alerts || {};
        return Object.keys(alerts).length > 0;
      }
    } catch (error) {
      console.error('Erro ao verificar alertas do usuário:', error);
    }
    return false;
  };

  const [usersWithAlerts, setUsersWithAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkAllUsersAlerts = async () => {
      const usersWithAlertsSet = new Set<string>();
      
      for (const user of authorizedEmails) {
        if (!user.isAdmin) {
          const hasAlerts = await checkUserHasAlerts(user.email);
          if (hasAlerts) {
            usersWithAlertsSet.add(user.email);
          }
        }
      }
      
      setUsersWithAlerts(usersWithAlertsSet);
    };

    if (authorizedEmails.length > 0) {
      checkAllUsersAlerts();
    }
  }, [authorizedEmails]);

  const filteredEmails = authorizedEmails.filter(item => {
    const matchesSearch = item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const hasAlertsFilter = showOnlyUsersWithAlerts ? usersWithAlerts.has(item.email) : true;
    const isAdminFilter = showOnlyAdmins ? item.isAdmin : true;
    
    return matchesSearch && hasAlertsFilter && isAdminFilter;
  });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadAuthorizedEmails(newPage);
    }
  };

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
              <h1 className="text-xl font-semibold text-white">{t('admin.title')}</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-zinc-300 hidden sm:block">
                {t('header.welcome', { name: user?.name || user?.email || t('header.userFallback') })}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto py-4 sm:py-8 px-4">
          {/* Título e Descrição */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">{t('admin.accessManagement')}</h2>
              <p className="text-zinc-300 text-sm sm:text-base">{t('admin.accessManagementDesc')}</p>
            </div>

            <div className="flex items-center space-x-2 text-zinc-300 mt-4 sm:mt-0">
              <Settings className="h-5 w-5" />
              <span className="text-sm sm:text-base">{t('admin.adminAdministration')}</span>
            </div>
          </div>

          {/* Card de Adicionar Email */}
          <Card className="bg-zinc-900 border-yellow-500/20 mb-6">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-white">{t('admin.addNewUser')}</h3>
              <p className="text-zinc-300 text-sm sm:text-base">{t('admin.addNewUserDesc')}</p>

              <form onSubmit={handleAddEmail} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-white mb-1 text-sm">{t('admin.name')} *</Label>
                    <Input 
                      type="text" 
                      placeholder={t('admin.namePlaceholder')}
                      value={newName}
                      onChange={(e) => {
                        setNewName(e.target.value);
                        if (showValidationErrors && e.target.value.trim()) {
                          setShowValidationErrors(false);
                        }
                      }}
                      className={`bg-zinc-800 text-white placeholder:text-zinc-400 focus:ring-yellow-500 focus:border-yellow-500 ${
                        showValidationErrors && !newName.trim() 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : 'border-zinc-600'
                      }`}
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-1 text-sm">{t('admin.email')} *</Label>
                    <Input 
                      type="email" 
                      placeholder={t('admin.emailPlaceholder')}
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value);
                        if (showValidationErrors && e.target.value.trim()) {
                          setShowValidationErrors(false);
                        }
                      }}
                      className={`bg-zinc-800 text-white placeholder:text-zinc-400 focus:ring-yellow-500 focus:border-yellow-500 ${
                        showValidationErrors && !newEmail.trim() 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : 'border-zinc-600'
                      }`}
                    />
                  </div>
                </div>

                {showValidationErrors && (!newEmail.trim() || !newName.trim()) && (
                  <div className="text-red-400 text-sm">
                    {t('admin.allFieldsRequired')}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-yellow-500 text-black font-medium hover:bg-yellow-600 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? t('admin.adding') : t('admin.addUserBtnText')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de Emails */}
          <Card className="bg-zinc-900 border-yellow-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">{t('header.authorizedEmails')}</h3>
                  <p className="text-sm text-zinc-400">
                    {searchTerm ? `${filteredEmails.length} ${t('admin.searchResults')}` : 
                    t('admin.pageOfUsers', { page: pagination.page, totalPages: pagination.totalPages, total: pagination.total })}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showOnlyAdmins"
                        checked={showOnlyAdmins}
                        onChange={(e) => setShowOnlyAdmins(e.target.checked)}
                        className="h-4 w-4 bg-zinc-800 border-zinc-600 rounded focus:ring-yellow-500 focus:border-yellow-500 focus:ring-offset-0 focus:ring-offset-zinc-800"
                        style={{
                          accentColor: '#eab308',
                          backgroundColor: showOnlyAdmins ? '#eab308' : '#27272a',
                          borderColor: showOnlyAdmins ? '#eab308' : '#52525b'
                        }}
                      />
                      <Label 
                        htmlFor="showOnlyAdmins" 
                        className="text-sm text-zinc-300 cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                      >
                        {t('admin.showOnlyAdmins')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showOnlyUsersWithAlerts"
                        checked={showOnlyUsersWithAlerts}
                        onChange={(e) => setShowOnlyUsersWithAlerts(e.target.checked)}
                        className="h-4 w-4 bg-zinc-800 border-zinc-600 rounded focus:ring-yellow-500 focus:border-yellow-500 focus:ring-offset-0 focus:ring-offset-zinc-800"
                        style={{
                          accentColor: '#eab308',
                          backgroundColor: showOnlyUsersWithAlerts ? '#eab308' : '#27272a',
                          borderColor: showOnlyUsersWithAlerts ? '#eab308' : '#52525b'
                        }}
                      />
                      <Label 
                        htmlFor="showOnlyUsersWithAlerts" 
                        className="text-sm text-zinc-300 cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                      >
                        {t('admin.showOnlyUsersWithAlerts')}
                      </Label>
                    </div>
                  </div>
                  <div className="relative flex-1 sm:flex-initial">
                    <div className="flex items-center space-x-2">
                      <Input 
                        type="text" 
                        placeholder={t('admin.searchUsers')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-zinc-800 border-zinc-800 text-white placeholder:text-zinc-400 w-full sm:w-64"
                      />
                      <button className="text-zinc-300 hover:text-white transition-colors">
                        <Search className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de emails */}
              <div className="space-y-3">
                {filteredEmails.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400">
                    {searchTerm 
                      ? t('admin.noUserFoundEmpty')
                      : showOnlyUsersWithAlerts 
                        ? t('admin.noUserWithAlerts')
                        : t('admin.noAuthorizedUser')
                    }
                  </div>
                ) : (
                  filteredEmails.map((item, index) => (
                    <div key={index} className="p-4 bg-zinc-800 rounded-lg">
                      {editingEmail === item.email ? (
                        // Modo de edição
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-white mb-1 text-sm">{t('admin.name')} *</Label>
                              <Input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="bg-zinc-700 border-zinc-600 text-white"
                                required
                              />
                            </div>
                            <div>
                              <Label className="text-white mb-1 text-sm">{t('admin.email')} *</Label>
                              <Input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="bg-zinc-700 border-zinc-600 text-white"
                                required
                              />
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              onClick={() => handleEditEmail(item.email)}
                              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                              disabled={!editEmail.trim() || !editName.trim()}
                            >
                              {t('admin.save')}
                            </Button>
                            <Button 
                              onClick={cancelEdit}
                              variant="outline"
                              className="border-zinc-600 text-black hover:bg-zinc-200"
                            >
                              {t('common.cancel')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Modo de visualização
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center space-x-4 min-w-0 flex-1">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-white truncate">{item.name || t('admin.noName')}</h4>
                              <p className="text-sm text-zinc-300">{item.email}</p>
                              {usersWithAlerts.has(item.email) && (
                                <button 
                                  onClick={() => toggleUserExpanded(item.email)}
                                  className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 transition-colors mt-1"
                                  title={t('admin.viewAlerts')}
                                >
                                  <Bell className="h-3 w-3" />
                                  {t('admin.alerts')}
                                  <ChevronDown 
                                    className={`h-3 w-3 transition-transform ${
                                      expandedUsers.has(item.email) ? 'rotate-180' : ''
                                    }`} 
                                  />
                                </button>
                              )}
                            </div>
                            {item.isAdmin && (
                              <span className="px-2 py-1 text-xs text-yellow-500 bg-yellow-500/10 rounded-full whitespace-nowrap">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between sm:justify-end space-x-2">
                            <span className="text-xs sm:text-sm text-zinc-400 truncate">
                              {item.lastAccess ? `${t('admin.lastAccess')} ${new Date(item.lastAccess).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}` : t('admin.neverAccessed')}
                            </span>
                            <div className="flex space-x-1">
                              {!item.isAdmin && (
                                <>
                                  <button 
                                    onClick={() => startEdit(item.email, item.name)}
                                    className="text-zinc-400 hover:text-blue-400 transition-colors p-1"
                                    title={t('admin.editUser')}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleRemoveEmail(item.email)}
                                    className="text-zinc-400 hover:text-red-400 transition-colors p-1"
                                    title={t('admin.removeEmail')}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Seção expandida com alertas do usuário */}
                      {expandedUsers.has(item.email) && (
                        <div className="mt-4 pt-4 border-t border-zinc-700">
                          <div className="flex items-center gap-2 mb-3">
                            <Bell className="h-4 w-4 text-yellow-400" />
                            <h5 className="text-sm font-medium text-white">{t('admin.userAlertsTitle')}</h5>
                          </div>
                          <UserAlerts email={item.email} />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Controles de Paginação */}
              {!searchTerm && pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                  <div className="text-sm text-zinc-400">
                    {t('admin.showingEmails', { 
                      start: ((pagination.page - 1) * pagination.limit) + 1, 
                      end: Math.min(pagination.page * pagination.limit, pagination.total), 
                      total: pagination.total 
                    })}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                    >
                      {t('admin.previous')}
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === pagination.page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className={pageNum === pagination.page 
                              ? "bg-yellow-500 text-black hover:bg-yellow-600" 
                              : "border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                    >
                      {t('admin.next')}
                    </Button>
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
