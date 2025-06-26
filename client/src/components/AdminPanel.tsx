
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Settings, Search, Trash2, LogOut, Edit, Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AlertsPanel } from "./AlertsPanel";

interface AuthorizedEmail {
  email: string;
  name: string;
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
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editName, setEditName] = useState("");
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Impedir scroll do body quando o painel está aberto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Carregar emails autorizados
  useEffect(() => {
    loadAuthorizedEmails(1);
  }, []);

  const loadAuthorizedEmails = async (page: number = currentPage) => {
    try {
      const response = await fetch(`/api/admin/emails?page=${page}&limit=${itemsPerPage}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Dados recebidos da API:', data);
        
        const allEmails: AuthorizedEmail[] = data.emails.map((item: any) => ({
          email: item.email,
          name: item.name || 'Sem nome',
          isAdmin: item.isAdmin || false,
          lastAccess: item.lastAccess || undefined
        }));

        console.log('Emails processados:', allEmails);
        setAuthorizedEmails(allEmails);
        setPagination(data.pagination);
        setCurrentPage(page);
      } else {
        console.error('Erro na resposta da API:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Erro ao carregar emails:', error);
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se os campos estão preenchidos
    if (!newEmail.trim() || !newName.trim()) {
      setShowValidationErrors(true);
      return;
    }

    setShowValidationErrors(false);
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: newEmail,
          name: newName,
          type: 'authorized' // Por padrão adiciona como usuário comum
        })
      });

      if (response.ok) {
        setNewEmail("");
        setNewName("");
        loadAuthorizedEmails(currentPage);
      }
    } catch (error) {
      console.error('Erro ao adicionar email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEmail = async (oldEmail: string) => {
    if (!editEmail.trim() || !editName.trim()) return;

    const emailToEdit = authorizedEmails.find(item => item.email === oldEmail);
    if (!emailToEdit) return;

    try {
      const response = await fetch('/api/admin/emails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          oldEmail,
          newEmail: editEmail,
          name: editName,
          type: emailToEdit.isAdmin ? 'admin' : 'authorized'
        })
      });

      if (response.ok) {
        setEditingEmail(null);
        setEditEmail("");
        setEditName("");
        loadAuthorizedEmails(currentPage);
      }
    } catch (error) {
      console.error('Erro ao editar email:', error);
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
        // Se a página atual ficou vazia após remoção, voltar para página anterior
        const newTotal = pagination.total - 1;
        const newTotalPages = Math.ceil(newTotal / itemsPerPage);
        const pageToLoad = currentPage > newTotalPages ? Math.max(1, newTotalPages) : currentPage;
        loadAuthorizedEmails(pageToLoad);
      }
    } catch (error) {
      console.error('Erro ao remover email:', error);
    }
  };

  const startEdit = (email: string, name: string) => {
    setEditingEmail(email);
    setEditEmail(email);
    setEditName(name);
  };

  const cancelEdit = () => {
    setEditingEmail(null);
    setEditEmail("");
    setEditName("");
  };

  const filteredEmails = authorizedEmails.filter(item =>
    item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadAuthorizedEmails(newPage);
    }
  };

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
                Olá {user?.name || user?.email || 'Usuário'}
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
                    <Label className="text-white mb-1 text-sm">Email *</Label>
                    <Input 
                      type="email" 
                      placeholder="cliente@exemplo.com" 
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value);
                        if (showValidationErrors && e.target.value.trim()) {
                          setShowValidationErrors(false);
                        }
                      }}
                      className={`bg-zinc-800 text-white placeholder:text-zinc-400 focus:ring-yellow-500 focus:border-yellow-500 ${
                        showValidationErrors && !newEmail.trim() 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : 'border-zinc-600'
                      }`}
                    />
                  </div>
                  <div>
                    <Label className="text-white mb-1 text-sm">Nome *</Label>
                    <Input 
                      type="text" 
                      placeholder="Nome do cliente" 
                      value={newName}
                      onChange={(e) => {
                        setNewName(e.target.value);
                        if (showValidationErrors && e.target.value.trim()) {
                          setShowValidationErrors(false);
                        }
                      }}
                      className={`bg-zinc-800 text-white placeholder:text-zinc-400 focus:ring-yellow-500 focus:border-yellow-500 ${
                        showValidationErrors && !newName.trim() 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : 'border-zinc-600'
                      }`}
                    />
                  </div>
                </div>

                {showValidationErrors && (!newEmail.trim() || !newName.trim()) && (
                  <div className="text-red-400 text-sm">
                    Todos os campos devem ser preenchidos.
                  </div>
                )}

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
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Emails Autorizados</h3>
                  <p className="text-sm text-zinc-400">
                    {searchTerm ? `${filteredEmails.length} resultado(s) encontrado(s)` : 
                    `Página ${pagination.page} de ${pagination.totalPages} (${pagination.total} total)`}
                  </p>
                </div>
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
                    <div key={index} className="p-4 bg-zinc-800 rounded-lg">
                      {editingEmail === item.email ? (
                        // Modo de edição
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-white mb-1 text-sm">Email *</Label>
                              <Input 
                                type="email" 
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="bg-zinc-700 border-zinc-600 text-white"
                                required
                              />
                            </div>
                            <div>
                              <Label className="text-white mb-1 text-sm">Nome *</Label>
                              <Input 
                                type="text" 
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="bg-zinc-700 border-zinc-600 text-white"
                                required
                              />
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              onClick={() => handleEditEmail(item.email)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              disabled={!editEmail.trim() || !editName.trim()}
                            >
                              Salvar
                            </Button>
                            <Button 
                              onClick={cancelEdit}
                              variant="outline"
                              className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Modo de visualização
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center space-x-4 min-w-0 flex-1">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-white truncate">{item.email}</h4>
                              <p className="text-sm text-zinc-300">{item.name || 'Sem nome'}</p>
                            </div>
                            {item.isAdmin && (
                              <span className="px-2 py-1 text-xs text-yellow-500 bg-yellow-500/10 rounded-full whitespace-nowrap">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between sm:justify-end space-x-2">
                            <span className="text-xs sm:text-sm text-zinc-400 truncate">
                              {item.lastAccess ? `Último acesso: ${new Date(item.lastAccess).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}` : "Nunca acessou"}
                            </span>
                            <div className="flex space-x-1">
                              {!item.isAdmin && (
                                <>
                                  <button 
                                    onClick={() => startEdit(item.email, item.name)}
                                    className="text-zinc-400 hover:text-blue-400 transition-colors p-1"
                                    title="Editar usuário"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleRemoveEmail(item.email)}
                                    className="text-zinc-400 hover:text-red-400 transition-colors p-1"
                                    title="Remover email"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Controles de Paginação */}
              {!searchTerm && pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                  <div className="text-sm text-zinc-400">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} emails
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                    >
                      Anterior
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === pagination.page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className={pageNum === pagination.page 
                              ? "bg-yellow-500 text-black hover:bg-yellow-600" 
                              : "border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                            }
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Painel de Alertas do Usuário */}
          <div className="mt-6">
            <AlertsPanel />
          </div>
        </main>
      </div>
    </div>
  );
}
