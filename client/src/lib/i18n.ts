import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importar arquivos de tradução
import en from '../locales/en.json';
import pt from '../locales/pt.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';

const resources = {
  en: { translation: en },
  pt: { translation: pt },
  es: { translation: es },
  fr: { translation: fr },
};

// Tentar recuperar idioma salvo no localStorage
const savedLanguage = localStorage.getItem('preferred_language');

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage || 'pt', // Usar idioma salvo ou padrão (português)
    fallbackLng: 'pt',

    interpolation: {
      escapeValue: false, // React já faz escape
    },
  });

export default i18n;
