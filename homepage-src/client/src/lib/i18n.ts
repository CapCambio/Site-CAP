import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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

const savedLanguage = localStorage.getItem('preferred_language');

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage || 'pt',
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
