import { useTranslation } from 'react-i18next';
import { WhatsAppFloatingButton } from "@/components/WhatsAppFloatingButton";

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('landing.title')}</h1>
        <p className="text-lg text-gray-600 mb-8">
          {t('landing.subtitle')}
        </p>
        <div>
          <a
            href="https://capcambio.up.railway.app/cotacoes"
            className="px-6 py-3 bg-[#f3b234] text-black font-semibold rounded-lg hover:bg-[#e5a12d] transition-colors inline-block"
          >
            {t('landing.cta')}
          </a>
        </div>
      </div>
      <WhatsAppFloatingButton />
    </div>
  );
}
