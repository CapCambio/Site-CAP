import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const changeLanguage = async (lng: string) => {
    i18n.changeLanguage(lng);

    // Salvar idioma no localStorage para todos os usuários
    localStorage.setItem('preferred_language', lng);

    // Salvar idioma no servidor se o usuário estiver autenticado
    if (user) {
      try {
        await fetch('/api/user/language', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: lng })
        });
      } catch (error) {
        console.error('Erro ao salvar idioma no servidor:', error);
      }
    }
  };

  const currentLanguage = i18n.language;

  const languageNames: Record<string, string> = {
    pt: 'Português',
    en: 'English',
    es: 'Español',
    fr: 'Français',
  };

  const languageShortNames: Record<string, string> = {
    pt: 'PT',
    en: 'EN',
    es: 'ES',
    fr: 'FR',
  };

  // Usar abreviações em telas menores (mobile e tablets)
  const displayNames = isMobile ? languageShortNames : languageNames;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative text-yellow-400 hover:text-yellow-300 hover:bg-zinc-800 gap-2">
          <Globe className="h-5 w-5" />
          <span className="text-sm font-medium">{displayNames[currentLanguage] || currentLanguage}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="bg-zinc-900 border-zinc-700 text-white">
        <DropdownMenuItem
          onClick={() => changeLanguage('pt')}
          className={currentLanguage === 'pt' ? 'bg-accent hover:bg-accent text-black' : 'hover:bg-zinc-800'}
        >
          {displayNames.pt}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('en')}
          className={currentLanguage === 'en' ? 'bg-accent hover:bg-accent text-black' : 'hover:bg-zinc-800'}
        >
          {displayNames.en}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('es')}
          className={currentLanguage === 'es' ? 'bg-accent hover:bg-accent text-black' : 'hover:bg-zinc-800'}
        >
          {displayNames.es}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('fr')}
          className={currentLanguage === 'fr' ? 'bg-accent hover:bg-accent text-black' : 'hover:bg-zinc-800'}
        >
          {displayNames.fr}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
