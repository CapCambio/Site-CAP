
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TermosDeUsoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermosDeUsoModal({ isOpen, onClose }: TermosDeUsoModalProps) {
  const { t, i18n } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-900 z-50 overflow-y-auto">
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-yellow-400 text-xl font-semibold">{t('terms.title')}</h2>
          <Button 
            onClick={onClose}
            className="h-10 w-10 p-0 bg-yellow-500 !bg-yellow-500 hover:bg-yellow-600 text-black border-none transition-colors duration-200"
            title={t('terms.close')}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="text-white max-w-4xl mx-auto">
          {i18n.language !== 'pt' && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 text-sm">
                {t('terms.disclaimer')}
              </p>
            </div>
          )}
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">{t('terms.section1.title')}</h3>
              <p className="text-zinc-300 mb-4">
                {t('terms.section1.content')}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">{t('terms.section2.title')}</h3>
              <p className="text-zinc-300 mb-4">
                {t('terms.section2.intro')}
              </p>
              <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
                <li>{t('terms.section2.item1')}</li>
                <li>{t('terms.section2.item2')}</li>
                <li>{t('terms.section2.item3')}</li>
                <li>{t('terms.section2.item4')}</li>
                <li>{t('terms.section2.item5')}</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">{t('terms.section3.title')}</h3>
              <p className="text-zinc-300 mb-4">
                {t('terms.section3.intro')}
              </p>
              <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
                <li>{t('terms.section3.item1')}</li>
                <li>{t('terms.section3.item2')}</li>
                <li>{t('terms.section3.item3')}</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">{t('terms.section4.title')}</h3>
              <p className="text-zinc-300 mb-4">
                {t('terms.section4.content')}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">{t('terms.section5.title')}</h3>
              <p className="text-zinc-300 mb-4">
                {t('terms.section5.intro')}
              </p>
              <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-2">
                <li>{t('terms.section5.item1')}</li>
                <li>{t('terms.section5.item2')}</li>
                <li>{t('terms.section5.item3')}</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">{t('terms.section6.title')}</h3>
              <p className="text-zinc-300 mb-4">
                {t('terms.section6.content')}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">{t('terms.section7.title')}</h3>
              <p className="text-zinc-300 mb-4">
                {t('terms.section7.content')}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">{t('terms.section8.title')}</h3>
              <p className="text-zinc-300 mb-4">
                {t('terms.section8.content1')}
              </p>
              <p className="text-zinc-300 mb-4">
                {t('terms.section8.content2')}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-yellow-400 mb-3">{t('terms.section9.title')}</h3>
              <p className="text-zinc-300 mb-4">
                {t('terms.section9.content')}
              </p>
              <p className="text-zinc-400 text-sm mt-2">
                {t('terms.section9.lastUpdate')}
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-center">
              <Button
                onClick={onClose}
                className="flex items-center gap-2 bg-yellow-500 !bg-yellow-500 text-black hover:bg-yellow-600 border-none transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('terms.back')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
