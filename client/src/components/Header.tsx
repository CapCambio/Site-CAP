import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  lastUpdate: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Header({ lastUpdate, onRefresh, isRefreshing }: HeaderProps) {
  return (
    <header className="bg-[#1a1a1a] text-white px-4 py-4 shadow-md">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-3 md:mb-0">
          <svg 
            className="w-10 h-10 mr-3"
            viewBox="0 0 40 40"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="40" height="40" rx="5" fill="#1a1a1a" />
            <path d="M8 8H32V32H8V8Z" fill="#f3b234" />
            <path d="M16 20L20 16L24 20L28 16V24L24 28L20 24L16 28V20Z" fill="#1a1a1a" />
          </svg>
          <h1 className="text-2xl font-bold text-[#f3b234]">CAP Cotações</h1>
        </div>
        <div className="flex flex-col md:flex-row items-center">
          <p className="text-sm mr-4 mb-2 md:mb-0">
            Última atualização: <span id="last-update">{lastUpdate}</span>
          </p>
          <div className="relative">
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
