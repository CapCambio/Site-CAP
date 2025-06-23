import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Tipo de usuário autenticado
interface AuthUser {
  email: string;
  name: string;
  isAdmin: boolean;
}

// Contexto de autenticação
interface AuthContextType {
  user: AuthUser | null;
  isAuthorized: boolean;
  isLoading: boolean;
  showAdminPanel: boolean;
  setShowAdminPanel: (show: boolean) => void;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Senha padrão de admin (em um ambiente real, seria armazenada de forma segura)
const ADMIN_PASSWORD = "passo2012";

// Criação do contexto
const AuthContext = createContext<AuthContextType | null>(null);

// Hook para uso do contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}

// Provider do contexto de autenticação
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const { toast } = useToast();

  // Tenta restaurar a sessão ao carregar a página
  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Garantir que os dados do usuário estão completos
        if (parsedUser.email) {
          setUser(parsedUser);
        } else {
          localStorage.removeItem("auth_user");
        }
      } catch (error) {
        console.error("Erro ao restaurar sessão:", error);
        localStorage.removeItem("auth_user");
      }
    }
  }, []);

  // Função de login
  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      // Faz a verificação de autorização no servidor
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && data.error?.includes('Senha incorreta')) {
          throw new Error('Senha incorreta');
        }
        return;
      }

      // Login bem-sucedido
      const userData: AuthUser = {
        email: data.user.email,
        name: data.user.name,
        isAdmin: data.user.isAdmin
      };

      setUser(userData);
      localStorage.setItem("auth_user", JSON.stringify(userData));

    } catch (error) {
      console.error("Erro ao fazer login:", error);
      // Re-throw o erro para que possa ser capturado pelo componente
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const logout = async () => {
    setIsLoading(true);
    try {
      // Simula uma chamada de API
      await new Promise(resolve => setTimeout(resolve, 500));

      setUser(null);
      localStorage.removeItem("auth_user");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthorized: !!user,
        isLoading,
        showAdminPanel,
        setShowAdminPanel,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}