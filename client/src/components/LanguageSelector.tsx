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

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const { user } = useAuth();

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative text-yellow-400 hover:text-yellow-300 hover:bg-zinc-800 gap-2">
          <Globe className="h-5 w-5" />
          <span className="text-sm font-medium">{languageNames[currentLanguage] || currentLanguage}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-700 text-white">
        <DropdownMenuItem
          onClick={() => changeLanguage('pt')}
          className={currentLanguage === 'pt' ? 'bg-accent hover:bg-accent text-black' : 'hover:bg-zinc-800'}
        >
          Português
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('en')}
          className={currentLanguage === 'en' ? 'bg-accent hover:bg-accent text-black' : 'hover:bg-zinc-800'}
        >
          English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('es')}
          className={currentLanguage === 'es' ? 'bg-accent hover:bg-accent text-black' : 'hover:bg-zinc-800'}
        >
          Español
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('fr')}
          className={currentLanguage === 'fr' ? 'bg-accent hover:bg-accent text-black' : 'hover:bg-zinc-800'}
        >
          Français
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
