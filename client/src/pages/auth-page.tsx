import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { WhatsAppFloatingButton } from "@/components/WhatsAppFloatingButton";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { Redirect } from "wouter";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function LoginPage() {
  const { t } = useTranslation();

  const formSchema = z.object({
    email: z.string().email({
      message: t('auth.emailInvalid'),
    }),
    password: z.string().optional(),
  });
  const { isAuthorized, login, isLoading } = useAuth();

  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [showSessionActiveError, setShowSessionActiveError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submittedWithValidEmail, setSubmittedWithValidEmail] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Verificar se o email é de administrador quando mudar
  const watchEmail = form.watch('email');

  // Fazer verificação no backend sem expor emails no frontend
  const checkIfAdmin = async (email: string) => {
    console.log('Verificando email:', email);
    
    if (!email || !email.match(/^[^@]+@[^@]+$/)) {
      console.log('Email inválido ou vazio');
      setIsAdmin(false);
      setEmailVerified(false);
      return;
    }

    try {
      // Verificar no backend se é admin sem expor a lista
      const response = await fetch('/api/auth/check-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsAdmin(data.isAdmin);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Erro ao verificar admin:', error);
      setIsAdmin(false);
    }
    
    setEmailVerified(true);
  };

  useEffect(() => {
    if (watchEmail) {
      // Verificação instantânea sem debounce
      checkIfAdmin(watchEmail);
      
      // Resetar erros quando email mudar
      setShowValidationErrors(false);
      setShowPasswordError(false);
      setShowSessionActiveError(false);
      setSubmittedWithValidEmail(false);
    }
  }, [watchEmail]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Resetar estado de submissão
    setSubmittedWithValidEmail(false);
    
    // Verificar se o email é válido antes de prosseguir
    const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
    if (!emailRegex.test(values.email)) {
      // Email inválido - não mostrar mensagem de "não autorizado"
      return;
    }
    
    // Email válido - marcar como submetido com email válido
    setSubmittedWithValidEmail(true);
    
    if (isAdmin && (!values.password || values.password.trim() === '')) {
      setShowValidationErrors(true);
      return;
    }
    
    // Resetar erros antes de tentar login
    setShowPasswordError(false);
    setShowSessionActiveError(false);
    try {
      await login(values.email, values.password);
    } catch (error) {
      if (error instanceof Error && error.message === 'SESSION_ALREADY_ACTIVE') {
        setShowSessionActiveError(true);
        setSubmittedWithValidEmail(false);
        return;
      }
      if (error instanceof Error && error.message.includes('Senha incorreta')) {
        setShowPasswordError(true);
      }
    }
  };

  // Verificar se já está autenticado
  if (isAuthorized) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      {/* LanguageSelector no canto direito superior */}
      <div className="absolute top-4 right-3 md:right-6 z-10">
        <LanguageSelector />
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-yellow-400/20 bg-zinc-900 text-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">{t('auth.title')}</CardTitle>
          <CardDescription className="text-zinc-400">
            {t('auth.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">{t('auth.email')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('auth.emailPlaceholder')} 
                        className="bg-zinc-800 border-zinc-700 text-white" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              {/* Campo de senha aparece apenas para admin */}
              {isAdmin && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">{t('auth.password')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder={t('auth.passwordPlaceholder')}
                            className={`bg-zinc-800 text-white pr-10 ${
                              (showValidationErrors && (!field.value || field.value.trim() === '')) || showPasswordError
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                : 'border-zinc-700'
                            }`}
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              if (showValidationErrors && e.target.value.trim()) {
                                setShowValidationErrors(false);
                              }
                              if (showPasswordError) {
                                setShowPasswordError(false);
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="absolute right-0 top-0 h-full px-3 py-2 text-zinc-500 hover:text-zinc-300 transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                      {showValidationErrors && (!field.value || field.value.trim() === '') && (
                        <div className="text-red-500 text-sm">
                          {t('auth.passwordRequired')}
                        </div>
                      )}
                      {showPasswordError && (
                        <div className="text-red-500 text-sm">
                          {t('auth.passwordIncorrect')}
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              )}

              <Button 
                type="submit" 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('auth.loginButton')
                )}
              </Button>

              {showSessionActiveError && !isAdmin && (
                <div className="mt-4 space-y-2">
                  <div className="text-red-500 text-sm">
                    {t('auth.sessionAlreadyActive')}
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await fetch('/api/auth/release-stale', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: watchEmail })
                        });
                        setShowSessionActiveError(false);
                        // Tentar login novamente automaticamente
                        await form.handleSubmit(onSubmit)();
                      } catch (error) {
                        console.error('Erro ao liberar sessão:', error);
                      }
                    }}
                    className="w-full text-sm text-yellow-500 underline hover:text-yellow-400"
                  >
                    {t('auth.releaseSession')}
                  </button>
                </div>
              )}

              {submittedWithValidEmail && !isAuthorized && !isLoading && !isAdmin && !showSessionActiveError && (
                <div className="mt-4 text-red-500 text-sm">
                  {t('auth.loginError')} {" "}
                  <button 
                    onClick={() => setShowBranchDialog(true)}
                    className="text-white underline hover:text-white/80"
                  >
                    {t('auth.contactAdmin')}
                  </button>.
                </div>
              )}
            </form>
          </Form>

          <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
            <DialogContent className="bg-zinc-900 border-yellow-500/20">
              <DialogHeader>
                <DialogTitle className="text-white">{t('auth.selectBranch')}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 mt-4">
                {[
                  { name: t('whatsapp.branchCaxias'), link: "https://api.whatsapp.com/send?phone=5554984348005&text=Vim%20do%20site%20e%20gostaria%20de%20informa%C3%A7%C3%B5es" },
                  { name: t('whatsapp.branchBento'), link: "https://api.whatsapp.com/send?phone=5554999578486&text=Vim%20do%20site%20e%20gostaria%20de%20informa%C3%A7%C3%B5es" },
                  { name: t('whatsapp.branchPasso'), link: "https://api.whatsapp.com/send?phone=5554996280422&text=Vim%20do%20site%20e%20gostaria%20de%20informa%C3%A7%C3%B5es" }
                ].map((branch) => (
                  <a
                    key={branch.name}
                    href={branch.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    <FaWhatsapp className="text-green-500 text-xl" />
                    <span className="text-yellow-500">{branch.name}</span>
                  </a>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-zinc-400 text-center">
            {t('auth.restrictedPage')} {" "}
            <button 
              onClick={() => setShowBranchDialog(true)}
              className="text-zinc-400 underline hover:text-zinc-300 transition-colors"
            >
              {t('auth.requestAccess')}
            </button>.
          </div>
        </CardFooter>
      </Card>
      
      {/* Botão flutuante do WhatsApp para solicitar acesso */}
        <WhatsAppFloatingButton />
      </div>
      
      {/* Rodapé */}
      <Footer />
    </div>
  );
}