import { trpc } from "@/lib/trpc";
import { Loader2, MessageCircle, Phone, Send } from "lucide-react";
import { FormEvent, useState } from "react";

type ArchivedContactSectionProps = {
  whatsappUrl: string;
};

/**
 * Seção de contato arquivada em 18/08/2026.
 *
 * Para restaurar, importe `ArchivedContactSection` em `Home.tsx` e renderize
 * `<ArchivedContactSection whatsappUrl={whatsappCaxias} />` antes da seção de lojas.
 */
export function ArchivedContactSection({ whatsappUrl }: ArchivedContactSectionProps) {
  const [formValues, setFormValues] = useState({ name: "", email: "", phone: "", message: "" });
  const contact = trpc.contact.submit.useMutation({
    onSuccess: () => setFormValues({ name: "", email: "", phone: "", message: "" }),
  });

  const submitContact = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    contact.mutate(formValues);
  };

  return (
    <section id="contato" className="scroll-mt-20 bg-[#facb2e] py-16 text-black sm:py-20">
      <div className="container grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="cap-kicker text-black/60">Atendimento CAP Câmbio</p>
          <h2 className="cap-display mt-3 max-w-xl text-4xl font-extrabold leading-[1.01] sm:text-5xl">Vamos encontrar a solução certa para sua operação.</h2>
          <p className="mt-6 max-w-md text-base leading-7 text-black/70">Envie sua mensagem. A solicitação é registrada com segurança e encaminhada para o responsável pelo atendimento.</p>
          <div className="mt-8 space-y-3 text-sm font-semibold">
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-black text-[#facb2e]"><MessageCircle className="size-4" /></span>WhatsApp geral: (54) 98434.8005</a>
            <a href="tel:+555432232000" className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-full bg-black text-[#facb2e]"><Phone className="size-4" /></span>Caxias do Sul: (54) 3223.2000</a>
          </div>
        </div>
        <form onSubmit={submitContact} className="rounded-[1.5rem] bg-black p-5 text-white shadow-[0_30px_70px_rgba(0,0,0,.25)] sm:p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold">Nome completo<input required value={formValues.name} onChange={e => setFormValues({ ...formValues, name: e.target.value })} className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-white/[.05] px-4 text-sm outline-none transition placeholder:text-white/25 focus:border-[#facb2e] focus:ring-2 focus:ring-[#facb2e]/20" placeholder="Como podemos chamar você?" /></label>
            <label className="text-sm font-semibold">Telefone<input required value={formValues.phone} onChange={e => setFormValues({ ...formValues, phone: e.target.value })} className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-white/[.05] px-4 text-sm outline-none transition placeholder:text-white/25 focus:border-[#facb2e] focus:ring-2 focus:ring-[#facb2e]/20" placeholder="(00) 00000-0000" /></label>
          </div>
          <label className="mt-5 block text-sm font-semibold">E-mail<input required type="email" value={formValues.email} onChange={e => setFormValues({ ...formValues, email: e.target.value })} className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-white/[.05] px-4 text-sm outline-none transition placeholder:text-white/25 focus:border-[#facb2e] focus:ring-2 focus:ring-[#facb2e]/20" placeholder="voce@empresa.com" /></label>
          <label className="mt-5 block text-sm font-semibold">Mensagem<textarea required value={formValues.message} onChange={e => setFormValues({ ...formValues, message: e.target.value })} rows={4} className="mt-2 w-full resize-none rounded-xl border border-white/15 bg-white/[.05] px-4 py-3 text-sm outline-none transition placeholder:text-white/25 focus:border-[#facb2e] focus:ring-2 focus:ring-[#facb2e]/20" placeholder="Conte brevemente como podemos ajudar." /></label>
          {contact.isSuccess && <p className="mt-4 rounded-xl bg-emerald-400/15 px-4 py-3 text-sm text-emerald-200">Mensagem recebida. Em breve, a equipe entrará em contato.</p>}
          {contact.isError && <p className="mt-4 rounded-xl bg-rose-400/15 px-4 py-3 text-sm text-rose-200">{contact.error.message || "Não foi possível enviar agora. Tente novamente."}</p>}
          <button disabled={contact.isPending} type="submit" className="cap-cta mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold disabled:opacity-65">{contact.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}{contact.isPending ? "Enviando solicitação" : "Enviar solicitação"}</button>
          <p className="mt-4 text-center text-xs leading-5 text-white/40">Ao enviar, você concorda com o uso dos dados para retorno sobre esta solicitação.</p>
        </form>
      </div>
    </section>
  );
}
