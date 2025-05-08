import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Redirect } from "wouter";
import { z } from "zod";

const formSchema = z.object({
  email: z.string().email({
    message: "Informe um endereço de email válido.",
  }),
  password: z.string().optional(),
});

export default function LoginPage() {
  const { isAuthorized, login, isLoading } = useAuth();
  const [showBranchDialog, setShowBranchDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Verificar se o email é de administrador quando mudar
  const watchEmail = form.watch('email');

  const checkIfAdmin = async (email: string) => {
    if (!email || !email.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      setIsAdmin(false);
      setEmailVerified(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/check-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      setIsAdmin(data.isAdmin || false);
      setEmailVerified(true);
    } catch (error) {
      console.error('Erro ao verificar email de admin:', error);
      setIsAdmin(false);
      setEmailVerified(false);
    }
  };

  useEffect(() => {
    if (watchEmail) {
      const delayDebounceFn = setTimeout(() => {
        checkIfAdmin(watchEmail);
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [watchEmail]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    login(values.email, values.password);
  };

  // Verificar se já está autenticado
  if (isAuthorized) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-yellow-400/20 bg-zinc-900 text-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">CAP Câmbio Cotações</CardTitle>
          <CardDescription className="text-zinc-400">
            Informe seu email para acessar as cotações de moedas.
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
                    <FormLabel className="text-white">Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="seu@email.com" 
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
                      <FormLabel className="text-white">Senha de Administrador</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Digite sua senha" 
                          className="bg-zinc-800 border-zinc-700 text-white" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
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
                    Verificando...
                  </>
                ) : (
                  "Acessar"
                )}
              </Button>
              
              {form.formState.isSubmitted && !isAuthorized && !isLoading && form.formState.errors.password && (
                <div className="mt-4 text-red-500 text-sm">
                  Senha incorreta
                </div>
              )}
              {form.formState.isSubmitted && !isAuthorized && !isLoading && !form.formState.errors.password && !isAdmin && (
                <div className="mt-4 text-red-500 text-sm">
                  Parece que seu e-mail não está autorizado, solicite seu acesso online{" "}
                  <button 
                    onClick={() => setShowBranchDialog(true)}
                    className="text-white underline hover:text-white/80"
                  >
                    aqui
                  </button>.
                </div>
              )}
            </form>
          </Form>

          <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
            <DialogContent className="bg-zinc-900 border-yellow-500/20">
              <DialogHeader>
                <DialogTitle className="text-white">Com qual CAP deseja falar?</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 mt-4">
                {[
                  { name: "Caxias do Sul - RS", link: "https://api.whatsapp.com/send?phone=5554984348005&text=Vim%20do%20site%20e%20gostaria%20de%20informa%C3%A7%C3%B5es" },
                  { name: "Bento Gonçalves - RS", link: "https://api.whatsapp.com/send?phone=5554999578486&text=Vim%20do%20site%20e%20gostaria%20de%20informa%C3%A7%C3%B5es" },
                  { name: "Passo Fundo - RS", link: "https://api.whatsapp.com/send?phone=5554996280422&text=Vim%20do%20site%20e%20gostaria%20de%20informa%C3%A7%C3%B5es" }
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
          <div className="text-sm text-zinc-500 text-center">
            Esta é uma página restrita. Apenas clientes cadastrados e com seu e-mail previamente autorizado pela CAP Câmbio podem acessar o contéudo.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}