
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Settings, Search, Trash2, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface AuthorizedEmail {
  email: string;
  name?: string;
  isAdmin: boolean;
  lastAccess?: string;
}

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const { user, logout } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [authorizedEmails, setAuthorizedEmails] = useState<AuthorizedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar emails autorizados
  useEffect(() => {
    loadAuthorizedEmails();
  }, []);

  const loadAuthorizedEmails = async () => {
    try {
      const response = await fetch('/api/admin/emails');
      if (response.ok) {
        const data = await response.json();
        // Converter formato da resposta para o formato esperado
        const allEmails: AuthorizedEmail[] = [
          ...data.authorized.map((email: string) => ({
            email,
            isAdmin: false,
            name: undefined,
            lastAccess: undefined
          })),
          ...data.admin.map((email: string) => ({
            email,
            isAdmin: true,
            name: undefined,
            lastAccess: undefined
          }))
        ];
        setAuthorizedEmails(allEmails);
      }
    } catch (error) {
      console.error('Erro ao carregar emails:', error);
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: newEmail,
          type: 'authorized' // Por padrão adiciona como usuário comum
        })
      });

      if (response.ok) {
        setNewEmail("");
        setNewName("");
        loadAuthorizedEmails();
      }
    } catch (error) {
      console.error('Erro ao adicionar email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveEmail = async (email: string) => {
    const emailToRemove = authorizedEmails.find(item => item.email === email);
    if (!emailToRemove) return;

    try {
      const response = await fetch('/api/admin/emails', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          type: emailToRemove.isAdmin ? 'admin' : 'authorized'
        })
      });

      if (response.ok) {
        loadAuthorizedEmails();
      }
    } catch (error) {
      console.error('Erro ao remover email:', error);
    }
  };

  const filteredEmails = authorizedEmails.filter(item =>
    item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-black text-white overflow-y-auto">
      <div className="min-h-full">
        {/* Header */}
        <header className="border-b border-yellow-500/20 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto flex justify-between items-center h-16 px-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={onClose}
                className="text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-white">Painel Administrativo</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-zinc-300 hidden sm:block">
                Olá {user?.email}
              </div>
              <button 
                onClick={logout}
                className="text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full p-2 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto py-4 sm:py-8 px-4">
          {/* Título e Descrição */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Gerenciamento de Acesso</h2>
              <p className="text-zinc-300 mt-1 text-sm sm:text-base">
                Adicione ou remova emails autorizados a acessar o sistema.
              </p>
            </div>

            <div className="flex items-center space-x-2 text-zinc-300 mt-4 sm:mt-0">
              <Settings className="h-5 w-5" />
              <span className="text-sm sm:text-base">Administração CAP Câmbio</span>
            </div>
          </div>

          {/* Card de Adicionar Email */}
          <Card className="bg-zinc-900 border-yellow-500/20 mb-6">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold mb-4 text-white">Adicionar Novo Email Autorizado</h3>
              <p className="text-zinc-300 mb-6 text-sm sm:text-base">Adicione novos emails que terão acesso às cotações de moedas.</p>

              <form onSubmit={handleAddEmail} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-white mb-1 text-sm">Email</Label>
                    <Input 
                      type="email" 
                      placeholder="cliente@exemplo.com" 
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:ring-yellow-500 focus:border-yellow-500"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-1 text-sm">Nome (opcional)</Label>
                    <Input 
                      type="text" 
                      placeholder="Nome do cliente" 
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-yellow-500 text-black font-medium hover:bg-yellow-600 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? "Adicionando..." : "Adicionar Email"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de Emails */}
          <Card className="bg-zinc-900 border-yellow-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                <h3 className="text-lg sm:text-xl font-bold text-white">Emails Autorizados ({filteredEmails.length})</h3>
                <div className="flex items-center space-x-2">
                  <Input 
                    type="text" 
                    placeholder="Buscar email..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 w-full sm:w-64"
                  />
                  <button className="text-zinc-300 hover:text-white transition-colors">
                    <Search className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Lista de emails */}
              <div className="space-y-3">
                {filteredEmails.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400">
                    {searchTerm ? "Nenhum email encontrado." : "Nenhum email autorizado cadastrado."}
                  </div>
                ) : (
                  filteredEmails.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-zinc-800 rounded-lg gap-3">
                      <div className="flex items-center space-x-4 min-w-0 flex-1">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-white truncate">{item.email}</h4>
                          <p className="text-sm text-zinc-300">
                            {item.name || (item.isAdmin ? "Administrador CAP Câmbio" : "Cliente")}
                          </p>
                        </div>
                        {item.isAdmin && (
                          <span className="px-2 py-1 text-xs text-yellow-500 bg-yellow-500/10 rounded-full whitespace-nowrap">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-2">
                        <span className="text-xs sm:text-sm text-zinc-400 truncate">
                          {item.lastAccess ? `Último acesso: ${item.lastAccess}` : "Nunca acessou"}
                        </span>
                        {!item.isAdmin && (
                          <button 
                            onClick={() => handleRemoveEmail(item.email)}
                            className="text-zinc-400 hover:text-red-400 transition-colors p-1"
                            title="Remover email"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
