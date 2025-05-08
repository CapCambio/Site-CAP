import capLogo from "@assets/cap logo fundo.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, User } from "lucide-react";

export function Header() {
  const { user, logout, isLoading } = useAuth();
  
  return (
    <header className="bg-[#000000] text-white px-4 pt-3 pb-0 shadow-md">
      <div className="container mx-auto">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {user && (
              <div className="flex items-center gap-2 mt-4">
                <User className="h-4 w-4 text-yellow-500" />
                <span className="text-xs text-yellow-500">{user.email}</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-center flex-1">
            <img 
              src={capLogo} 
              alt="CAP Câmbio Logo" 
              className="h-28 md:h-32"
            />
          </div>
          
          <div className="flex-1 flex justify-end">
            {user && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-yellow-500 hover:text-yellow-600 hover:bg-transparent mt-4"
                onClick={() => logout()}
                disabled={isLoading}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sair
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}