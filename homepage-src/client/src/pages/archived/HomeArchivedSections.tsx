import { ArrowRight, BadgeCheck, Check, LockKeyhole, MessageCircle, Phone, ShieldCheck } from "lucide-react";

type ArchivedSectionsProps = {
  onPrepareInquiry: (message: string) => void;
  whatsappUrl: string;
};

/**
 * Seções removidas da página inicial em agosto de 2026 a pedido da CAP Câmbio.
 * Para restaurá-las, importe os componentes em Home.tsx e renderize-os após
 * a seção de serviços, passando prepareInquiry e whatsappCaxias como props.
 */
export function ProcessJourneySection({ onPrepareInquiry }: Pick<ArchivedSectionsProps, "onPrepareInquiry">) {
  return (
    <section id="como-funciona" className="scroll-mt-24 border-y border-white/10 bg-black py-20 sm:py-28">
      <div className="container grid gap-10 lg:grid-cols-[.85fr_1.15fr]">
        <div>
          <p className="cap-kicker text-[#facb2e]">Uma jornada sem ruído</p>
          <h2 className="cap-display mt-3 max-w-xl text-4xl font-extrabold leading-[1.02] sm:text-5xl">Você entende o próximo passo antes de avançar.</h2>
          <p className="mt-6 max-w-md text-base leading-7 text-white/60">Câmbio não precisa ser um processo opaco. A CAP começa ouvindo a sua necessidade e segue com clareza até a conclusão da operação.</p>
          <button onClick={() => onPrepareInquiry("Gostaria de iniciar uma solicitação e entender os próximos passos.")} className="cap-cta mt-8 inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold">Iniciar solicitação <ArrowRight className="size-4" /></button>
        </div>
        <div className="divide-y divide-white/10 border-y border-white/10">
          <div className="grid gap-4 py-6 sm:grid-cols-[76px_1fr_auto] sm:items-center"><span className="cap-display text-4xl font-extrabold text-[#facb2e]">01</span><div><p className="text-lg font-bold">Solicite</p><p className="mt-1 text-sm leading-6 text-white/54">Conte o que você precisa, informe sua unidade preferida e escolha como quer falar com a equipe.</p></div><MessageCircle className="hidden size-6 text-[#facb2e] sm:block" /></div>
          <div className="grid gap-4 py-6 sm:grid-cols-[76px_1fr_auto] sm:items-center"><span className="cap-display text-4xl font-extrabold text-[#facb2e]">02</span><div><p className="text-lg font-bold">Confirme</p><p className="mt-1 text-sm leading-6 text-white/54">Um especialista orienta condições, disponibilidade, documentos e o formato mais adequado para a sua necessidade.</p></div><ShieldCheck className="hidden size-6 text-[#facb2e] sm:block" /></div>
          <div className="grid gap-4 py-6 sm:grid-cols-[76px_1fr_auto] sm:items-center"><span className="cap-display text-4xl font-extrabold text-[#facb2e]">03</span><div><p className="text-lg font-bold">Conclua</p><p className="mt-1 text-sm leading-6 text-white/54">Finalize pelo canal ou unidade indicada, com acompanhamento até o encerramento da sua solicitação.</p></div><Check className="hidden size-6 text-[#facb2e] sm:block" /></div>
        </div>
      </div>
    </section>
  );
}

export function TrustCenterSection({ whatsappUrl }: Pick<ArchivedSectionsProps, "whatsappUrl">) {
  return (
    <section id="confianca" className="scroll-mt-24 py-20 sm:py-28">
      <div className="container grid gap-10 lg:grid-cols-[.78fr_1.22fr]">
        <div>
          <p className="cap-kicker text-[#facb2e]">Centro de confiança CAP</p>
          <h2 className="cap-display mt-3 text-4xl font-extrabold leading-[1.02] sm:text-5xl">Segurança para decidir. Clareza para avançar.</h2>
          <p className="mt-6 max-w-md text-base leading-7 text-white/60">Quando dinheiro cruza fronteiras, informação de qualidade e canais confiáveis fazem parte da experiência.</p>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="cap-outline mt-8 inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold">Conferir canal oficial <ShieldCheck className="size-4 text-[#facb2e]" /></a>
        </div>
        <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
          <div className="grid gap-4 border-b border-white/10 bg-white/[.025] p-6 sm:grid-cols-[56px_1fr]"><div className="flex size-12 items-center justify-center rounded-2xl bg-[#facb2e] text-black"><Phone className="size-5" /></div><div><p className="text-base font-bold">Fale pelos canais divulgados pela CAP.</p><p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">Telefones, e-mails e WhatsApps de cada unidade estão reunidos neste site. Em caso de dúvida, confirme o contato diretamente com a loja antes de enviar dados ou realizar pagamentos.</p></div></div>
          <div className="grid gap-4 border-b border-white/10 p-6 sm:grid-cols-[56px_1fr]"><div className="flex size-12 items-center justify-center rounded-2xl border border-[#facb2e]/35 bg-[#facb2e]/10 text-[#facb2e]"><LockKeyhole className="size-5" /></div><div><p className="text-base font-bold">Proteja informações sensíveis.</p><p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">A CAP não precisa de senhas, códigos de autenticação ou dados bancários no formulário deste site. Compartilhe apenas o necessário para iniciar o atendimento.</p></div></div>
          <div className="grid gap-4 p-6 sm:grid-cols-[56px_1fr]"><div className="flex size-12 items-center justify-center rounded-2xl border border-[#facb2e]/35 bg-[#facb2e]/10 text-[#facb2e]"><BadgeCheck className="size-5" /></div><div><p className="text-base font-bold">Entenda antes de concluir.</p><p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">Condições, disponibilidade e documentos podem variar conforme a operação. Nossa equipe explica os próximos passos para que você decida com segurança.</p></div></div>
        </div>
      </div>
    </section>
  );
}
