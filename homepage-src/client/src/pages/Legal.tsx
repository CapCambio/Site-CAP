import { ArrowLeft, BadgeCheck, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

type LegalKind = "privacy" | "terms";
const capLogoUrl = `${import.meta.env.BASE_URL}assets/cap-logo.png`;

const copy: Record<LegalKind, { kicker: string; title: string; intro: string; sections: Array<[string, string]> }> = {
  privacy: {
    kicker: "Privacidade",
    title: "Informações claras sobre o uso do seu contato.",
    intro: "Este aviso unificado descreve, em linguagem simples, como os dados tratados no site institucional e na plataforma CAP Cotações são utilizados pela CAP Câmbio.",
    sections: [
      ["Dados enviados", "Os canais de contato podem solicitar nome, e-mail, telefone e mensagem. Evite incluir dados bancários, senhas, documentos ou informações sensíveis em mensagens."],
      ["Finalidade", "As informações são registradas para responder à solicitação de atendimento, preparar uma cotação quando aplicável e manter o histórico básico do contato."],
      ["Cookies e métricas", "O site utiliza cookies e tecnologias de medição, mediante seu consentimento, para compreender o uso do site e aprimorar a experiência na plataforma."],
      ["Acesso e proteção", "O acesso aos pedidos é restrito ao atendimento responsável. A CAP Câmbio deve avaliar continuamente suas práticas internas de segurança e retenção de dados."],
      ["Seus canais", "Para dúvidas sobre um contato enviado, use os canais oficiais divulgados nesta página e informe os dados necessários para localizar a solicitação."],
    ],
  },
  terms: {
    kicker: "Termos de uso",
    title: "Transparência antes de qualquer operação.",
    intro: "Estes termos unificados abrangem o site institucional e a plataforma CAP Cotações. Qualquer operação deve ser confirmada diretamente com a CAP Câmbio.",
    sections: [
      ["CAP Cotações", "As informações disponibilizadas na plataforma têm caráter de acompanhamento e referência. Elas não representam proposta, reserva, taxa garantida ou condição final de contratação."],
      ["Atendimento", "Condições, disponibilidade de moedas, documentos e prazos variam conforme a operação. Confirme esses pontos com um especialista antes de tomar uma decisão."],
      ["Conteúdo", "Os textos e elementos deste site não substituem orientação financeira, jurídica, contábil ou tributária específica para o seu caso."],
      ["Atualizações", "Os conteúdos institucionais e operacionais podem ser atualizados para refletir mudanças nos serviços e nos canais de atendimento."],
    ],
  },
};

export default function Legal({ kind }: { kind: LegalKind }) {
  const content = copy[kind];
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="cap-grid fixed inset-0 -z-10 opacity-35 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="container max-w-4xl py-8 sm:py-14">
        <Link href="/" className="cap-outline inline-flex h-12 items-center gap-2 rounded-full px-3 text-sm font-bold"><img src={capLogoUrl} alt="CAP Câmbio" className="h-8 w-auto object-contain" /><ArrowLeft className="size-4" />Voltar</Link>
        <div className="mt-14 max-w-3xl">
          <p className="cap-kicker text-[#facb2e]">{content.kicker}</p>
          <h1 className="cap-display mt-4 text-4xl font-extrabold leading-[1.02] sm:text-6xl">{content.title}</h1>
          <p className="mt-7 text-base leading-7 text-white/64 sm:text-lg">{content.intro}</p>
        </div>
        <div className="mt-12 grid gap-4">{content.sections.map(([title, text], index) => <section key={title} className="cap-surface rounded-2xl p-6 sm:p-7"><div className="flex gap-4"><div className="mt-0.5 rounded-xl bg-[#facb2e] p-2 text-black">{index % 2 === 0 ? <ShieldCheck className="size-5" /> : <BadgeCheck className="size-5" />}</div><div><h2 className="cap-display text-xl font-extrabold">{title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">{text}</p></div></div></section>)}</div>
        <p className="mt-10 border-t border-white/10 pt-6 text-xs leading-5 text-white/38">Última atualização visual desta página: agosto de 2026. Para políticas internas completas ou dúvidas específicas, entre em contato diretamente com a CAP Câmbio.</p>
      </div>
    </main>
  );
}
