
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
      const response = await fetch('/api/auth/authorized-emails');
      if (response.ok) {
        const data = await response.json();
        setAuthorizedEmails(data.emails);
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
      const response = await fetch('/api/auth/add-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: newEmail,
          name: newName || undefined
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
    try {
      const response = await fetch('/api/auth/remove-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
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
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-yellow-500/20 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center h-16 px-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onClose}
              className="text-yellow-400 hover:text-yellow-300"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold">Painel Administrativo</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-zinc-400">
              Olá {user?.email}
            </div>
            <button 
              onClick={logout}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full p-2"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4">
        {/* Título e Descrição */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Gerenciamento de Acesso</h2>
            <p className="text-zinc-400 mt-1">
              Adicione ou remova emails autorizados a acessar o sistema.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-zinc-400">
            <Settings className="h-5 w-5" />
            <span>Administração CAP Câmbio</span>
          </div>
        </div>

        {/* Card de Adicionar Email */}
        <Card className="bg-zinc-900 border-yellow-500/20">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">Adicionar Novo Email Autorizado</h3>
            <p className="text-zinc-400 mb-6">Adicione novos emails que terão acesso às cotações de moedas.</p>

            <form onSubmit={handleAddEmail} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-white mb-1">Email</Label>
                  <Input 
                    type="email" 
                    placeholder="cliente@exemplo.com" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white focus:ring-yellow-500"
                    required
                  />
                </div>
                <div>
                  <Label className="text-white mb-1">Nome</Label>
                  <Input 
                    type="text" 
                    placeholder="Nome do cliente" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white focus:ring-yellow-500"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-yellow-500 text-black font-medium hover:bg-yellow-600"
                disabled={isLoading}
              >
                {isLoading ? "Adicionando..." : "Adicionar Email"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Emails */}
        <div className="mt-6">
          <Card className="bg-zinc-900 border-yellow-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Emails Autorizados</h3>
                <div className="flex items-center space-x-2">
                  <Input 
                    type="text" 
                    placeholder="Buscar email ou nome..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white w-64"
                  />
                  <button className="text-zinc-400 hover:text-white">
                    <Search className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Lista de emails */}
              <div className="space-y-4">
                {filteredEmails.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-medium">{item.email}</h4>
                        <p className="text-sm text-zinc-400">
                          {item.name || (item.isAdmin ? "Administrador CAP Câmbio" : "Cliente")}
                        </p>
                      </div>
                      {item.isAdmin && (
                        <span className="px-2 py-1 text-xs text-yellow-500 bg-yellow-500/10 rounded-full">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-zinc-400">
                        {item.lastAccess ? `Último acesso: ${item.lastAccess}` : "Nunca acessou"}
                      </span>
                      {!item.isAdmin && (
                        <button 
                          onClick={() => handleRemoveEmail(item.email)}
                          className="text-zinc-400 hover:text-red-400"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
