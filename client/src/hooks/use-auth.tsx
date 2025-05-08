import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Tipo de usuário autenticado
interface AuthUser {
  email: string;
  isAdmin: boolean;
}

// Contexto de autenticação
interface AuthContextType {
  user: AuthUser | null;
  isAuthorized: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Lista de emails autorizados (em um ambiente real, isso viria do banco de dados)
const AUTHORIZED_EMAILS = [
  "cliente@example.com",
  "admin@example.com"
];

// Lista de emails de admin (em um ambiente real, isso viria do banco de dados)
const ADMIN_EMAILS = [
  "admin@example.com"
];

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
  const { toast } = useToast();

  // Tenta restaurar a sessão ao carregar a página
  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
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
      // Simula uma chamada de API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verifica se o email está autorizado
      const isAuthorized = AUTHORIZED_EMAILS.includes(email);
      if (!isAuthorized) {
        return;
      }

      // Verifica se é um admin e se precisa de senha
      const isAdmin = ADMIN_EMAILS.includes(email);
      if (isAdmin && password !== ADMIN_PASSWORD) {
        toast({
          title: "Senha incorreta",
          description: "A senha de administrador está incorreta.",
          variant: "destructive",
        });
        return;
      }

      // Login bem-sucedido
      const userData: AuthUser = {
        email,
        isAdmin
      };

      setUser(userData);
      localStorage.setItem("auth_user", JSON.stringify(userData));
      
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${email}!`,
      });

    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro ao tentar fazer login.",
        variant: "destructive",
      });
      console.error("Erro ao fazer login:", error);
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
      
      toast({
        title: "Logout realizado",
        description: "Você saiu do sistema com sucesso.",
      });
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
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}