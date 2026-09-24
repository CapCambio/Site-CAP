import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, MessageCircle, Quote } from "lucide-react";

/**
 * Arquivo de preservação das seções "Experiências reais" e "FAQ".
 * Os componentes podem ser restaurados individualmente em Home.tsx.
 */

const archivedFaqs = [
  ["Quais documentos preciso apresentar para comprar ou vender moedas?", <><p><strong>Pessoas físicas residentes no Brasil:</strong> Devem apresentar um documento de identificação com foto e CPF, que precisa estar em situação regular e válida junto à Receita Federal e que não esteja vencido.</p><p className="mt-4"><strong>Estrangeiros não residentes:</strong> Podem utilizar o documento de viagem (passaporte) ou o documento do seu país, caso sejam da Argentina, Bolívia, Paraguai ou Uruguai.</p><p className="mt-4"><strong>Nota:</strong> Dependendo do valor ou perfil da operação, documentos complementares, como comprovante de renda ou residência, podem ser solicitados.</p></>],
  ["Como posso realizar o pagamento?", <><p><strong>Câmbio e envios internacionais DHL:</strong> O pagamento pode ser realizado com dinheiro em espécie, Pix ou TED (dentro do horário bancário).</p><p className="mt-4"><strong>Transferências internacionais:</strong> Via MoneyGram, o pagamento é aceito somente em dinheiro em espécie. Via RIA/Unitransfer, é aceito dinheiro em espécie ou Pix.</p></>],
  ["Preciso reservar a moeda antes de ir à loja?", "Não é obrigatório, mas recomendamos a reserva pelo WhatsApp para garantir a disponibilidade da moeda e agilizar o seu atendimento. Você pode apenas separar o valor ou antecipar o pagamento via Pix."],
  ["Como posso ser pago caso venda moeda estrangeira?", "Você pode receber em dinheiro em espécie ou direto na sua conta via PIX (os limites de operação mudam conforme a forma de pagamento)."],
  ["Como posso receber o dinheiro que alguém enviou para mim?", <><p>Pagamentos abaixo de R$10.000 podem ser realizados em espécie ou via transferência.</p><p className="mt-4">Pagamentos acima de R$10.000 devem ser realizados obrigatoriamente via transferência.</p><p className="mt-4">Lembrando que pagamos apenas remessas enviadas pelo sistema MoneyGram.</p></>],
  ["Com quais moedas a CAP trabalha?", <><p>Trabalhamos com:</p><ul className="mt-4 grid gap-1.5 sm:grid-cols-2">{["Dólar Americano", "Euro", "Libra Esterlina", "Dólar Australiano", "Peso Argentino", "Dólar Neozelandês", "Dólar Canadense", "Franco Suíço", "Peso Uruguaio", "Peso Chileno", "Peso Mexicano", "Peso Colombiano", "Iuan Chinês", "Iene Japonês", "Novo Sol Peruano", "Rand Africano", "Dirham dos Emirados Árabes"].map((currency) => <li key={currency} className="flex items-center gap-2"><span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-[#facb2e]" />{currency}</li>)}</ul></>],
] as const;

type ArchivedExperiencesProps = {
  onContactClick: () => void;
};

type ArchivedFaqProps = {
  whatsappUrl: string;
};

export function ArchivedExperiences({ onContactClick }: ArchivedExperiencesProps) {
  return (
    <section id="depoimentos" className="border-y border-white/10 bg-[#0a0a09] py-20 sm:py-28">
      <div className="container grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <p className="cap-kicker text-[#facb2e]">Experiências reais</p>
          <h2 className="cap-display mt-3 text-4xl font-extrabold sm:text-5xl">A confiança se constrói em cada atendimento.</h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/60">A CAP Câmbio publica apenas relatos com autorização e validação de quem os enviou. Este espaço está preparado para receber experiências reais de clientes.</p>
        </div>
        <div className="cap-surface flex min-h-[270px] flex-col justify-between rounded-[1.5rem] p-7 sm:p-9">
          <Quote className="size-10 text-[#facb2e]" />
          <div>
            <p className="cap-display max-w-lg text-2xl font-bold leading-tight">“Sua experiência merece ser compartilhada com responsabilidade.”</p>
            <p className="mt-4 text-sm leading-6 text-white/50">Se você já foi atendido pela CAP Câmbio, conte como foi. Os relatos são avaliados antes de qualquer publicação.</p>
          </div>
          <button onClick={onContactClick} className="mt-7 inline-flex w-fit items-center gap-2 text-sm font-bold text-[#facb2e]">Falar com a equipe <ArrowRight className="size-4" /></button>
        </div>
      </div>
    </section>
  );
}

export function ArchivedFaq({ whatsappUrl }: ArchivedFaqProps) {
  return (
    <section id="faq" className="scroll-mt-24 py-20 max-sm:py-10 sm:py-20 lg:py-5">
      <div className="container grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="cap-kicker text-[#facb2e]">Tire suas dúvidas</p>
          <h2 className="cap-display mt-3 text-4xl font-extrabold sm:text-5xl">Informação clara antes de cada decisão.</h2>
          <p className="mt-6 max-w-md text-base leading-7 text-white/75">Ainda precisa de ajuda? A equipe está pronta para ouvir sua necessidade e orientar o próximo passo.</p>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="cap-outline mt-7 inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold">Conversar no WhatsApp <MessageCircle className="size-4 text-[#facb2e]" /></a>
        </div>
        <Accordion type="single" collapsible className="rounded-2xl border border-white/10 bg-white/[.02] px-5 sm:px-7">
          {archivedFaqs.map(([question, answer], index) => (
            <AccordionItem key={question} value={`faq-${index}`}>
              <AccordionTrigger className="py-6 text-base font-bold text-white hover:no-underline">{question}</AccordionTrigger>
              <AccordionContent className="max-w-2xl pb-6 text-sm leading-6 text-white/72">{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

type ArchivedExperiencesAndFaqProps = ArchivedExperiencesProps & ArchivedFaqProps;

export function ArchivedExperiencesAndFaq({ onContactClick, whatsappUrl }: ArchivedExperiencesAndFaqProps) {
  return <><ArchivedExperiences onContactClick={onContactClick} /><ArchivedFaq whatsappUrl={whatsappUrl} /></>;
}
