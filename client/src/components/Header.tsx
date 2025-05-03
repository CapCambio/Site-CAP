import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import capLogo from "@assets/cap logo fundo.png";

interface HeaderProps {
  lastUpdate: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Header({ lastUpdate, onRefresh, isRefreshing }: HeaderProps) {
  return (
    <header className="bg-[#1a1a1a] text-white px-4 py-3 shadow-md">
      <div className="container mx-auto">
        {/* Logo Centralizado */}
        <div className="flex justify-center mb-4">
          <img 
            src={capLogo} 
            alt="CAP Câmbio Logo" 
            className="h-14 md:h-16"
          />
        </div>
        
        {/* Informações e Botão Centralizado */}
        <div className="flex flex-col items-center justify-center">
          <p className="text-sm mb-2">
            Última atualização: <span id="last-update">{lastUpdate}</span>
          </p>
          <div>
            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="bg-[#f3b234] hover:bg-[#e09a20] text-[#1a1a1a] font-medium"
              variant="default"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
