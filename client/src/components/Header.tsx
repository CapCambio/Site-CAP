import capLogo from "@assets/cap logo fundo.png";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, Settings } from "lucide-react";
import { useState } from "react";
import AdminPanel from "./AdminPanel";

export function Header() {
  const { user, logout } = useAuth();
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  if (!user) {
    return null;
  }

  if (showAdminPanel) {
    return <AdminPanel onClose={() => setShowAdminPanel(false)} />;
  }

  return (
    <header className="bg-[#000000] text-white px-4 py-2 shadow-md mb-2">
      <div className="container mx-auto">
        <div className="flex flex-col items-center">
          <img 
            src={capLogo} 
            alt="CAP Câmbio Logo" 
            className="h-24 md:h-28 mb-1"
          />

          {/* Botões do usuário */}
          {user && (
            <div className="flex items-center justify-center gap-3">
              <span className="text-white text-sm">
                Olá {user?.name || user?.email || 'Usuário'}
              </span>
              {user.isAdmin && (
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="text-white hover:text-[#f3b234] p-1 transition-colors duration-200"
                  title="Configurações"
                >
                  <Settings className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={logout}
                className="text-white hover:text-[#f3b234] p-1 transition-colors duration-200"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}