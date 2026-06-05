const fs = require('fs');
const path = require('path');

// Chaves faltantes para adicionar (em português como base)
const missingKeys = {
  header: {
    emailRemoved: "Email removido",
    emailAddedSuccess: "Email adicionado com sucesso",
    manageAuthorizedEmails: "Gerenciar Emails Autorizados",
    addEmail: "Adicionar Email",
    emailLabel: "Email",
    typeLabel: "Tipo",
    commonUser: "Usuário Comum",
    adminLabel: "Administrador",
    addUserBtn: "Adicionar",
    commonUsers: "Usuários Comuns",
    admins: "Administradores",
    removeBtn: "Remover",
    logoAlt: "CAP Câmbio Logo",
    userFallback: "Usuário",
    errorLoadEmails: "Erro ao carregar emails",
    errorAddEmail: "Erro ao adicionar email",
    errorRemoveEmail: "Erro ao remover email",
    emailAddedDesc: "Email {{email}} adicionado com sucesso.",
    emailRemovedDesc: "Email {{email}} removido com sucesso."
  },
  alerts: {
    alertCreatedSpecific: "Você será notificado quando o preço de venda de {{currencyName}} ficar igual ou {{condition}} de R$ {{value}}.",
    riseAction: "subir",
    fallAction: "cair",
    alertCreatedPeriod: "Você será notificado sempre que o preço de venda de {{currencyName}} {{action}} até {{date}}."
  },
  admin: {
    searchUsers: "Buscar usuário...",
    pageOfUsers: "Página {{page}} de {{totalPages}} ({{total}} usuário(s) com alertas)",
    noUserFound: "Nenhum usuário encontrado",
    noAlertsConfiguredAdmin: "Nenhum alerta configurado",
    noSearchResults: "Nenhum usuário encontrado.",
    noSearchResultsDesc: "Não foram encontrados usuários com alertas para esta busca.",
    alertsConfigured: "alerta(s) configurado(s)",
    showingUsers: "Mostrando {{start}} a {{end}} de {{total}} usuários",
    alertsSent: "Alertas enviados",
    today: "Hoje",
    thisMonth: "Este mês",
    userAlerts: "Alertas dos Usuários",
    userAlertsDesc: "Gerencie todos os alertas configurados pelos usuários do sistema.",
    loadingAlerts: "Carregando alertas...",
    noAlertsConfigured: "Nenhum alerta configurado",
    nameNotFound: "Nome não encontrado",
    alertBothCases: "Avisar em ambos os casos",
    indefiniteTime: "Tempo Indeterminado",
    until: "Até",
    january: "Janeiro",
    february: "Fevereiro",
    march: "Março",
    april: "Abril",
    may: "Maio",
    june: "Junho",
    july: "Julho",
    august: "Agosto",
    september: "Setembro",
    october: "Outubro",
    november: "Novembro",
    december: "Dezembro"
  },
  alertsPanel: {
    myAlerts: "Meus Alertas",
    helloUser: "Olá {{name}}",
    myAlertsConfigured: "Meus Alertas Configurados",
    alertsCount: "{{count}} alerta(s) configurado(s)",
    loadingAlerts: "Carregando alertas...",
    noAlertsConfigured: "Nenhum alerta configurado",
    noAlertsDesc: "Você ainda não possui alertas configurados para variações de moedas.",
    createAlertStep1: "Volte para a página principal.",
    createAlertStep2: "Clique no botão \"Criar alerta\" em qualquer moeda.",
    createAlertStep3: "Configure o tipo, tempo de duração ou preço desejado.",
    createAlertStep4: "Confirme a criação do alerta.",
    aboutNotifications: "Sobre as notificações:",
    notificationEmail: "E-mail: Você receberá um e-mail quando o alerta for disparado. Verifique a caixa de spam/lixo eletrônico se não receber.",
    notificationPush: "Notificações Push: Receba alertas instantâneos no seu navegador ou dispositivo móvel.",
    notificationInstall: "Instale o app: Receba notificações mesmo com o navegador fechado instalando o aplicativo no seu dispositivo.",
    notificationTroubleshoot: "Não recebeu notificações? Verifique se as notificações estão ativadas no seu navegador e se o site tem permissão para enviar notificações."
  },
  notificationPreferences: {
    errorLoadPreferences: "Erro ao carregar preferências de notificação",
    preferencesSaved: "Preferências salvas com sucesso!",
    errorSavePreferences: "Erro ao salvar preferências de notificação",
    permissionNotGranted: "Permissão para notificações não concedida",
    errorEnableNotifications: "Não foi possível ativar as notificações",
    errorDisableNotifications: "Não foi possível desativar as notificações",
    needPermission: "É necessário permitir notificações para ativar",
    loadingPreferences: "Carregando preferências...",
    notificationsTitle: "Notificações",
    notSupportedDesc: "Seu navegador não suporta notificações push.",
    preferencesTitle: "Preferências de Notificação",
    preferencesDesc: "Gerencie como você deseja receber notificações",
    activateNotifications: "Ativar Notificações",
    notificationsActive: "Notificações ativadas",
    notificationsInactive: "Notificações desativadas",
    notificationTypes: "Tipos de notificação",
    frequency: "Frequência",
    realtime: "Tempo real",
    hourly: "A cada hora",
    daily: "Diário",
    settingsAuto: "As configurações são salvas automaticamente.",
    settingsAuto2: "Você pode alterar essas configurações a qualquer momento."
  },
  whatsapp: {
    branchCaxias: "Caxias do Sul - RS",
    branchBento: "Bento Gonçalves - RS",
    branchPasso: "Passo Fundo - RS"
  },
  loading: {
    text: "Carregando..."
  }
};

function addKeysToFile(filepath, keysToAdd) {
  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  
  for (const [section, keys] of Object.entries(keysToAdd)) {
    if (!data[section]) {
      data[section] = {};
    }
    for (const [key, value] of Object.entries(keys)) {
      if (!(key in data[section])) {
        data[section][key] = value;
      }
    }
  }
  
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${filepath}`);
}

// Adicionar chaves ao es.json e fr.json
addKeysToFile(path.join(__dirname, '../client/src/locales/es.json'), missingKeys);
addKeysToFile(path.join(__dirname, '../client/src/locales/fr.json'), missingKeys);

console.log('Done!');
