import capLogo from "@assets/cap logo fundo.png";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Settings, Bell } from "lucide-react";
import { useState } from "react";
import AdminPanel from "./AdminPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const { user, logout, showAdminPanel, setShowAdminPanel } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [emails, setEmails] = useState({ authorized: [], admin: [] });
  const [newEmail, setNewEmail] = useState("");
  const [emailType, setEmailType] = useState<"authorized" | "admin">("authorized");
  const { toast } = useToast();

  const loadEmails = async () => {
    try {
      const response = await fetch('/api/admin/emails');
      if (response.ok) {
        const data = await response.json();
        setEmails(data);
      }
    } catch (error) {
      console.error('Erro ao carregar emails:', error);
    }
  };

  const addEmail = async () => {
    if (!newEmail.trim()) return;

    try {
      const response = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, type: emailType })
      });

      if (response.ok) {
        setNewEmail("");
        loadEmails();
        toast({
          title: "Email adicionado",
          description: `Email ${newEmail} adicionado com sucesso.`
        });
      }
    } catch (error) {
      console.error('Erro ao adicionar email:', error);
    }
  };

  const removeEmail = async (email: string, type: "authorized" | "admin") => {
    try {
      const response = await fetch('/api/admin/emails', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type })
      });

      if (response.ok) {
        loadEmails();
        toast({
          title: "Email removido",
          description: `Email ${email} removido com sucesso.`
        });
      }
    } catch (error) {
      console.error('Erro ao remover email:', error);
    }
  };

  const openSettings = () => {
    setIsSettingsOpen(true);
    loadEmails();
  };


  if (!user) {
    return null;
  }

   if (showAdminPanel) {
        return <AdminPanel onClose={() => setShowAdminPanel(false)} />;
    }

  return (
    <>
      <header className="bg-[#000000] text-white px-4 py-2 shadow-md mb-2">
        <div className="container mx-auto">
          <div className="flex flex-col items-center">
            <img 
              src={capLogo} 
              alt="CAP Câmbio Logo" 
              className="h-24 md:h-28 mb-1"
            />
            {/* Botões do usuário - sempre abaixo do logo */}
            {user && (
              <div className="flex flex-col items-center gap-2">
                <span className="text-white text-sm">
                  Olá {user?.name || 'Usuário'}
                </span>
                <div className="flex items-center justify-center gap-3">
                  {!user.isAdmin && (
                    <Button
                      onClick={() => setShowAlertsPanel(true)}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:text-yellow-400 hover:bg-zinc-800 relative"
                      title="Meus Alertas"
                    >
                      Meus Alertas
                      <Bell className="h-5 w-5 ml-1" />
                      {alertCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600"
                        >
                          {alertCount}
                        </Badge>
                      )}
                    </Button>
                  )}
                  {user.isAdmin && (
                    <Button
                      onClick={() => setShowAdminPanel(true)}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:text-yellow-400 hover:bg-zinc-800"
                      title="Gerenciamento"
                    >
                      Gerenciamento
                      <Settings className="h-5 w-5 ml-1" />
                    </Button>
                  )}
                  <Button
                    onClick={logout}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-yellow-400 hover:bg-zinc-800"
                    title="Sair"
                  >
                    Sair
                    <LogOut className="h-5 w-5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal de configurações para admins */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gerenciar Emails Autorizados</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Adicionar novo email */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Adicionar Email</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-email">Email</Label>
                  <Input
                    id="new-email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="exemplo@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-type">Tipo</Label>
                  <select
                    id="email-type"
                    value={emailType}
                    onChange={(e) => setEmailType(e.target.value as "authorized" | "admin")}
                    className="w-full p-2 border rounded"
                  >
                    <option value="authorized">Usuário Comum</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={addEmail} className="w-full">
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>

            {/* Lista de emails autorizados */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Usuários Comuns</h3>
              <div className="space-y-2">
                {emails.authorized.map((email: string) => (
                  <div key={email} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                    <span>{email}</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeEmail(email, "authorized")}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Lista de emails admin */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Administradores</h3>
              <div className="space-y-2">
                {emails.admin.map((email: string) => (
                  <div key={email} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                    <span>{email}</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeEmail(email, "admin")}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}