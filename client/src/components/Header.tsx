import capLogo from "/optimized/cap-logo-fundo-optimized.webp";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Settings, Bell } from "lucide-react";
import { useState } from "react";
import AdminPanel from "./AdminPanel";
import { AlertsPanel } from "./AlertsPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LanguageSelector } from "./LanguageSelector";
import { useTranslation } from "react-i18next";

export function Header() {
  const { t } = useTranslation();
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
      console.error(t('header.errorLoadEmails'), error);
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
          title: t('toasts.emailAdded'),
          description: t('header.emailAddedDesc', { email: newEmail })
        });
      }
    } catch (error) {
      console.error(t('header.errorAddEmail'), error);
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
          title: t('header.emailRemoved'),
          description: t('header.emailRemovedDesc', { email })
        });
      }
    } catch (error) {
      console.error(t('header.errorRemoveEmail'), error);
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

    if (showAlertsPanel) {
        return <AlertsPanel isOpen={showAlertsPanel} onClose={() => setShowAlertsPanel(false)} />;
    }

  return (
    <>
      <header className="bg-[#000000] text-white px-4 py-2 shadow-md mb-2">
        <div className="container mx-auto">
          <div className="flex flex-col items-center relative">
            {/* LanguageSelector no canto direito superior */}
            <div className="absolute top-4 right-3 md:right-6 z-10">
              <LanguageSelector />
            </div>
            <img 
              src={capLogo} 
              alt={t('header.logoAlt')} 
              className="h-24 md:h-32 mb-1"
            />
            {/* Botões do usuário - sempre abaixo do logo */}
            {user && (
              <div className="flex flex-col items-center gap-2">
                <span className="text-white text-xs sm:text-sm lg:text-base">
                  {t('header.welcome', { name: user?.name || t('header.userFallback') })}
                </span>
                <div className="flex items-center justify-center gap-3">
                  {!user.isAdmin && (
                    <Button
                      onClick={() => setShowAlertsPanel(true)}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:text-yellow-400 hover:bg-zinc-800 relative"
                      title={t('header.alerts')}
                    >
                      {t('header.alerts')}
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
                      title={t('header.adminPanel')}
                    >
                      {t('header.adminPanel')}
                      <Settings className="h-5 w-5 ml-1" />
                    </Button>
                  )}
                  <Button
                    onClick={logout}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:text-yellow-400 hover:bg-zinc-800"
                    title={t('header.logout')}
                  >
                    {t('header.logout')}
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
            <DialogTitle>{t('header.manageAuthorizedEmails')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Adicionar novo email */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('header.addEmail')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-email">{t('header.emailLabel')}</Label>
                  <Input
                    id="new-email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="exemplo@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-type">{t('header.typeLabel')}</Label>
                  <select
                    id="email-type"
                    value={emailType}
                    onChange={(e) => setEmailType(e.target.value as "authorized" | "admin")}
                    className="w-full p-2 border rounded"
                  >
                    <option value="authorized">{t('header.commonUser')}</option>
                    <option value="admin">{t('header.adminLabel')}</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={addEmail} className="w-full">
                    {t('header.addUserBtn')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Lista de emails autorizados */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('header.commonUsers')}</h3>
              <div className="space-y-2">
                {emails.authorized.map((email: string) => (
                  <div key={email} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                    <span>{email}</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeEmail(email, "authorized")}
                    >
                      {t('header.removeBtn')}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Lista de emails admin */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t('header.admins')}</h3>
              <div className="space-y-2">
                {emails.admin.map((email: string) => (
                  <div key={email} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                    <span>{email}</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeEmail(email, "admin")}
                    >
                      {t('header.removeBtn')}
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