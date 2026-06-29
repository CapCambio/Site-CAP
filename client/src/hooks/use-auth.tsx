import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";

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
  const { t } = useTranslation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const { toast } = useToast();

  // Função para carregar o idioma salvo do usuário
  const loadUserLanguage = async () => {
    try {
      const response = await fetch('/api/user/language', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.language) {
          // Sempre atualizar o idioma com o valor do servidor
          i18n.changeLanguage(data.language);
          localStorage.setItem('preferred_language', data.language);
          console.log(`🌐 Idioma carregado do servidor: ${data.language}`);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar idioma do usuário:', error);
    }
  };

  // Tenta restaurar a sessão ao carregar a página
  useEffect(() => {
    let cancelled = false;

    const validateSession = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (!response.ok) {
          if (cancelled) return;

          const storedUser = localStorage.getItem("auth_user");
          if (storedUser) {
            try {
              const { email } = JSON.parse(storedUser);
              if (email) {
                await fetch('/api/auth/release-stale', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, orphan: true }),
                });
              }
            } catch {
              // ignore
            }
          }

          setUser(null);
          localStorage.removeItem("auth_user");
          return;
        }

        const data = await response.json();
        const serverUser = data?.user;

        if (cancelled) return;

        if (serverUser?.email) {
          const userData: AuthUser = {
            email: serverUser.email,
            name: serverUser.name,
            isAdmin: !!serverUser.isAdmin,
          };
          setUser(userData);
          localStorage.setItem("auth_user", JSON.stringify(userData));

          // Carregar idioma salvo do usuário
          await loadUserLanguage();
        } else {
          setUser(null);
          localStorage.removeItem("auth_user");
        }
      } catch (error) {
        console.error("Erro ao validar sessão:", error);
        if (cancelled) return;
        setUser(null);
        localStorage.removeItem("auth_user");
        toast({
          title: t('toasts.sessionError'),
          description: t('toasts.sessionErrorDesc'),
          variant: "destructive"
        });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    validateSession();
    return () => {
      cancelled = true;
    };
  }, []);

  // Função de login
  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      // Faz a verificação de autorização no servidor
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && data.error?.includes('Senha incorreta')) {
          throw new Error('Senha incorreta');
        }
        if (response.status === 409) {
          throw new Error('SESSION_ALREADY_ACTIVE');
        }
        throw new Error(data.error || 'Erro ao fazer login');
      }

      // Login bem-sucedido
      const userData: AuthUser = {
        email: data.user.email,
        name: data.user.name,
        isAdmin: data.user.isAdmin
      };

      setUser(userData);
      localStorage.setItem("auth_user", JSON.stringify(userData));

      // Carregar idioma salvo do usuário
      await loadUserLanguage();

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
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user?.email })
        });
      } catch (error) {
        console.error("Erro ao fazer logout no servidor:", error);
        toast({
          title: t('toasts.logoutError'),
          description: t('toasts.logoutErrorDesc'),
          variant: "destructive"
        });
      }

      setUser(null);
      localStorage.removeItem("auth_user");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Heartbeat para detectar sessões ativas (apenas para usuários regulares)
  useEffect(() => {
    if (!user || user.isAdmin) return;

    const sendHeartbeat = async () => {
      try {
        await fetch('/api/auth/heartbeat', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        // Ignora erros silenciosamente
      }
    };

    // Envia heartbeat imediatamente
    sendHeartbeat();

    // Depois a cada 15 segundos
    const interval = setInterval(sendHeartbeat, 15000);

    return () => clearInterval(interval);
  }, [user]);

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