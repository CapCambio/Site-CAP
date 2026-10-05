import { useTranslation } from 'react-i18next';
import { Globe2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [langOpen, setLangOpen] = useState(false);

  const langs: [string, string][] = [['pt', 'PT'], ['en', 'EN'], ['es', 'ES'], ['fr', 'FR']];

  const changeLanguage = async (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('preferred_language', code);
    setLangOpen(false);

    if (user) {
      try {
        await fetch('/api/user/language', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: code })
        });
      } catch (error) {
        console.error('Erro ao salvar idioma no servidor:', error);
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setLangOpen(v => !v)}
        className="cap-outline inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-white"
        aria-label="Language"
      >
        <Globe2 className="size-3.5" />
        {i18n.language.toUpperCase().slice(0, 2)}
      </button>
      {langOpen && (
        <div className="absolute right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl">
          {langs.map(([code, label]) => (
            <button
              key={code}
              onClick={() => changeLanguage(code)}
              className={`block w-full px-4 py-2 text-left text-xs font-bold transition hover:bg-white/5 ${
                i18n.language === code ? 'text-[#facb2e]' : 'text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
