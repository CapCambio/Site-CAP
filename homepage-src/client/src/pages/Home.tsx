import { ArchivedFaq } from "./archived/ExperiencesAndFaq";
import {
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  Globe2,
  Handshake,
  Landmark,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  MonitorSmartphone,
  Phone,
  PlaneTakeoff,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getNextRotatorIndex, isRotatorAutoplayActive, rotatorAutoplayDuration, rotatorTitles } from "@shared/cityRotator";

const whatsappGeneralMessage = encodeURIComponent("Olá! Vim pelo site da CAP e gostaria de mais informações.");
const whatsappCambioMessage = encodeURIComponent("Olá! Vim pelo site da CAP e gostaria de consultar cotações de moeda.");
const whatsappCaxias = `https://api.whatsapp.com/send?phone=5554984348005&text=${whatsappGeneralMessage}`;
const whatsappCambio = `https://api.whatsapp.com/send?phone=5554984348005&text=${whatsappCambioMessage}`;
const footerWhatsApp = `https://api.whatsapp.com/send?phone=5554984348005&text=${encodeURIComponent("Olá, gostaria de falar com a equipe da CAP Câmbio.")}`;
const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`;
const capLogoUrl = asset("cap-logo.png");
const offices = [
  {
    city: "Caxias do Sul",
    address: "Rua Borges Medeiros 391, Loja 8 · Hipermercado Zaffari · Centro",
    phone: "(54) 3223.2000",
    whatsapp: "(54) 98434.8005",
    whatsappLink: `https://api.whatsapp.com/send?phone=5554984348005&text=${whatsappGeneralMessage}`,
    email: "capcambio_caxias@hotmail.com",
    map: "https://www.google.com/maps/search/?api=1&query=Rua+Borges+Medeiros+391+Caxias+do+Sul+RS",
	    photo: asset("caxias.png"),
	    photoTreatment: "contain" as const,
	    hoursPanelTop: "top-[18rem]",
	    hours: ["Segunda a sexta: 9h às 20h", "Sábado: 10h às 20h", "Domingo: Fechado"],
    dhlAuthorized: false,
  },
  {
    city: "Bento Gonçalves",
    address: "Rua Treze de Maio 877, Loja 204 · Shopping Lá América · São Bento",
    phone: "(54) 3453.5060",
    whatsapp: "(54) 99957.8486",
    whatsappLink: `https://api.whatsapp.com/send?phone=5554999578486&text=${whatsappGeneralMessage}`,
    email: "capcambio_bento@hotmail.com",
    map: "https://www.google.com/maps/search/?api=1&query=Rua+Treze+de+Maio+877+Bento+Goncalves+RS",
	    photo: asset("bento.png"),
	    photoTreatment: "contain" as const,
    hoursPanelTop: "top-[17rem]",
	    hours: ["Segunda a sexta: 10h às 20h", "Sábado: 10h às 19h", "Domingo: Fechado"],
    dhlAuthorized: true,
  },
  {
    city: "Passo Fundo",
    address: "Av. Brasil Leste 200, Loja 40 · Shopping Bourbon · Petrópolis",
    phone: "(54) 3046.0088",
    whatsapp: "(54) 99628.0422",
    whatsappLink: `https://api.whatsapp.com/send?phone=5554996280422&text=${whatsappGeneralMessage}`,
    email: "capcambio_passo@hotmail.com",
    map: "https://www.google.com/maps/search/?api=1&query=Av+Brasil+Leste+200+Passo+Fundo+RS",
	    photo: asset("passo.png"),
	    photoTreatment: "contain" as const,
	    hoursPanelTop: "top-[18rem]",
	    hours: ["Segunda a sábado: 10h às 20h", "Domingo: Fechado"],
    dhlAuthorized: true,
  },
];

const services = [
  { icon: Banknote, image: asset("icone-dinheiro.png"), imageSize: "h-[5.1rem]", logoAlt: "Ícone de notas de dinheiro em espécie", title: "Papel Moeda", text: "Compra e venda de moedas estrangeiras. Trabalhamos com as principais moedas do mundo com taxas competitivas.", cta: "Consultar câmbio" },
  { icon: BriefcaseBusiness, image: asset("remessa-expressa.png"), imageSize: "h-16", logoAlt: "Logo Remessa Expressa", title: "Transferências Internacionais", text: <>Envie dinheiro para o exterior pelas redes <strong className="font-extrabold text-white/85">MoneyGram</strong> ou <strong className="font-extrabold text-white/85">RIA/Unitransfer</strong>, com orientação da nossa equipe sobre prazos e condições. Receba seus valores em espécie via <strong className="font-extrabold text-white/85">MoneyGram</strong>.</>, cta: "Consultar remessa" },
  { icon: Globe2, image: asset("dhl-horizontal.png"), imageSize: "h-14", logoAlt: "Logo DHL", title: "Envios Internacionais de Pacotes e Documentos", text: <>Envie objetos para qualquer lugar do mundo com segurança. Nossas lojas de <strong className="font-extrabold text-white/85">Bento Gonçalves</strong> e <strong className="font-extrabold text-white/85">Passo Fundo</strong> são agentes autorizados <strong className="font-extrabold text-white/85">DHL</strong>.</>, cta: "Consultar envio" },
];

const differentials = [
  { index: "01", title: "Taxas competitivas e sem letras miúdas", text: "Tenha clareza sobre as condições e o valor da operação antes de concluir." },
  { index: "02", title: "Uma pessoa do outro lado", text: "Não somos só uma tela. Nossos atendentes possuem certificações ABT e PLDFT, prontos para acompanhar você durante toda a sua operação." },
  { index: "03", title: "Tempo é parte do serviço", text: "Resposta rápida, processo organizado e suporte em tempo real." },
];

const reservationSteps = [
  { index: "01", title: "Consulte a cotação", text: "Fale com nossa equipe pelo WhatsApp e informe a moeda e o valor desejado.", icon: MessageCircle },
  { index: "02", title: "Reserve sua moeda", text: "Após a confirmação da equipe, deixamos sua reserva separada.", icon: CircleDollarSign },
  { index: "03", title: "Escolha como pagar", text: "Pague na retirada ou antecipe o pagamento por Pix e envie o comprovante pelo WhatsApp.", icon: WalletCards },
  { index: "04", title: "Retire na loja escolhida", text: "Passe em uma das lojas CAP dentro do horário de atendimento e retire sua reserva com praticidade.", icon: MapPin },
];

const platformAccessWhatsApp = `https://api.whatsapp.com/send?phone=5554984348005&text=${encodeURIComponent("Olá, sou cliente CAP e gostaria de solicitar acesso à plataforma de cotações.")}`;

const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M20.25 11.62a8.17 8.17 0 0 1-12.06 7.2L4 20l1.22-4.02A8.17 8.17 0 1 1 20.25 11.62Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.05 7.92c.18-.4.37-.4.55-.4h.47c.15 0 .35.06.45.31l.7 1.67c.08.2.05.4-.08.58l-.36.48c-.1.14-.2.25-.08.45.1.18.51.82 1.1 1.33.76.68 1.4.9 1.6 1 .2.1.31.08.43-.05l.54-.64c.13-.16.27-.13.45-.07l1.74.82c.22.1.36.16.41.26.05.11.05.63-.15 1.22-.2.58-1.16 1.1-1.6 1.16-.4.05-.9.07-1.45-.1a6.66 6.66 0 0 1-1.36-.5 10.93 10.93 0 0 1-4.47-3.95 5.1 5.1 0 0 1-1.07-2.71c0-.8.42-1.19.57-1.36Z" fill="currentColor" />
    </svg>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [isRotatorPaused, setIsRotatorPaused] = useState(false);

  useEffect(() => {
    if (!isRotatorAutoplayActive(isRotatorPaused)) return;

    const rotation = window.setInterval(() => {
      setActiveWordIndex(currentIndex => getNextRotatorIndex(currentIndex));
    }, rotatorAutoplayDuration);

    return () => window.clearInterval(rotation);
  }, [isRotatorPaused]);

  const selectOffice = (titleIndex: number) => {
    setIsRotatorPaused(true);
    setActiveWordIndex(titleIndex);
  };

  const activeTitle = rotatorTitles[activeWordIndex];
  const activeOffice = offices[activeWordIndex];

  const navigate = (id: string) => {
    setMenuOpen(false);
    scrollToId(id);
  };

  const serviceMessages: Record<string, string> = {
    "Consultar câmbio": "Olá! Vim pelo site da CAP e gostaria de consultar cotações de moeda.",
    "Consultar remessa": "Olá! Vim pelo site da CAP e gostaria de saber sobre transferências internacionais.",
    "Consultar envio": "Olá! Vim pelo site da CAP e gostaria de saber sobre envios internacionais DHL.",
  };

  const openServiceInquiry = (cta: string) => {
    window.dispatchEvent(new CustomEvent("cap:open-whatsapp", { detail: { hideCaxias: /^Consultar envio/i.test(cta), message: serviceMessages[cta] } }));
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#facb2e] selection:text-black">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="container flex h-[76px] items-center justify-between gap-5">
          <button onClick={() => scrollToId("inicio")} className="group flex shrink-0 items-center text-left" aria-label="Ir para o início">
            <img src={capLogoUrl} alt="CAP Câmbio" className="h-16 w-auto object-contain sm:h-[4.5rem]" />
          </button>
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Navegação principal">
            {[ ["Serviços", "servicos"], ["CAP Cotações", "cotacoes"], ["Sobre", "sobre"], ["Lojas", "lojas"], ["FAQ", "faq"] ].map(([label, id]) => <button key={id} onClick={() => scrollToId(id)} className="cap-nav-link text-sm font-medium">{label}</button>)}
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <a href={whatsappCaxias} target="_blank" rel="noreferrer" className="cap-cta inline-flex items-center gap-1 rounded-full px-4 py-2.5 text-sm font-bold"><WhatsAppIcon className="size-4" />Fale Conosco</a>
          </div>
          <button onClick={() => setMenuOpen(current => !current)} className="rounded-lg p-2 text-white lg:hidden" aria-label="Abrir menu" aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
        {menuOpen && <div className="border-t border-white/10 bg-black px-4 py-4 lg:hidden"><nav className="container grid gap-1" aria-label="Navegação móvel">{[["Serviços", "servicos"], ["CAP Cotações", "cotacoes"], ["Sobre", "sobre"], ["Lojas", "lojas"], ["FAQ", "faq"]].map(([label, id]) => <button key={id} onClick={() => navigate(id)} className="rounded-lg px-3 py-3 text-left text-sm font-semibold text-white/80 hover:bg-white/5">{label}</button>)}<a href={whatsappCaxias} target="_blank" rel="noreferrer" className="cap-cta mt-2 inline-flex items-center justify-center gap-1 rounded-lg px-3 py-3 text-center text-sm font-bold"><WhatsAppIcon className="size-4" />Fale Conosco</a></nav></div>}
      </header>

      <main>
        <section id="inicio" className="relative isolate overflow-hidden bg-black pt-[76px]">
          <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden lg:hidden">
            <img src={asset("janela-paris.jpeg")} alt="" className="h-full w-full object-cover object-[60%_center]" />
            <div className="absolute inset-0 bg-black/55" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_0%,transparent_17%,transparent_78%,#000_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#000_0%,transparent_14%,transparent_76%,#000_100%)]" />
          </div>
          <div className="container relative z-10 grid min-h-[600px] items-start gap-10 py-12 sm:py-16 lg:min-h-[520px] lg:grid-cols-[1.1fr_.9fr] lg:pb-2 lg:pt-10">
            <div className="max-w-[760px]">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#facb2e]/25 bg-[#facb2e]/10 px-3 py-1.5 text-xs font-bold text-[#facb2e]"><span className="cap-pulse h-1.5 w-1.5 rounded-full bg-[#facb2e]" />Desde 2006 no mercado cambial</div>
              <h1 className="cap-display max-w-[680px] text-5xl font-extrabold leading-[.95] text-white sm:text-6xl lg:text-7xl">Câmbio que acompanha <span className="text-[#facb2e]">o seu próximo passo.</span></h1>
              <p className="mt-7 max-w-[600px] text-base leading-7 text-white/75 sm:text-lg">Câmbio seguro, transparente e próximo de você. Consulte a cotação, reserve sua moeda e retire na loja CAP mais conveniente.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row"><span aria-hidden="true" className="invisible inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold lg:hidden">Encontre sua solução <ArrowDownRight className="size-4" /></span><a href={whatsappCambio} data-cap-whatsapp-message="Olá! Vim pelo site da CAP e gostaria de consultar cotações de moeda." target="_blank" rel="noreferrer" className="cap-cta inline-flex h-12 items-center justify-center gap-1 rounded-full px-6 text-sm font-bold"><WhatsAppIcon className="size-4" />Consultar cotação</a></div>
              <div className="mx-auto mt-5 flex w-fit min-w-[282px] items-center justify-center gap-2 rounded-xl border border-[#facb2e]/30 bg-black/60 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm lg:hidden"><BadgeCheck className="size-4 shrink-0 text-[#facb2e]" /><span className="whitespace-nowrap">Confiança que atravessa fronteiras</span></div>
            </div>
            <div className="hidden lg:relative lg:z-auto lg:mx-0 lg:block lg:w-full lg:max-w-[410px] lg:translate-x-10 lg:overflow-visible">
              <div className="cap-float relative overflow-hidden bg-black lg:aspect-[.78]">
                <img src={asset("janela-paris.jpeg")} alt="Vista noturna de Paris pela janela de um avião, com carteira CAP Câmbio e euros" className="h-full w-full object-cover object-center" />
                <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,#000_0%,transparent_17%,transparent_78%,#000_100%)]" />
                <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,#000_0%,transparent_14%,transparent_76%,#000_100%)]" />
              </div>
              <div className="absolute -left-28 top-[62%] hidden rounded-xl border border-[#facb2e]/30 bg-black px-4 py-3 text-sm font-semibold shadow-2xl sm:flex sm:items-center sm:gap-3"><BadgeCheck className="size-6 text-[#facb2e]" /><span>Confiança que<br /><span className="text-white/55">atravessa fronteiras</span></span></div>
            </div>
          </div>
        </section>

        <section id="servicos" className="scroll-mt-24 bg-[#0d0d0b] py-20 max-sm:py-10 sm:py-20 lg:pb-5 lg:pt-0">
          <div className="container">
            <div className="max-w-2xl"><p className="cap-kicker text-[#facb2e]">Soluções CAP</p><h2 className="cap-display mt-3 text-4xl font-extrabold sm:text-5xl">A solução certa para cada objetivo.</h2></div>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {services.map(({ icon: Icon, image, imageSize, logoAlt, title, text, cta }, index) => (
                <article key={`${title}-${index}`} className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black p-7 text-center transition duration-200 hover:border-[#facb2e]/45">
                  <div className={`mt-2 flex items-center justify-center ${image ? imageSize ?? "h-12" : "h-12"}`}>
                    {image ? <img src={image} alt={logoAlt ?? title} className={`${imageSize ?? "h-12"} w-auto max-w-full rounded-lg object-contain`} /> : <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#facb2e] text-black"><Icon className="size-6" /></div>}
                  </div>
                  <h3 className="cap-display mt-7 text-[1.65rem] font-extrabold leading-[1.05] sm:text-[1.75rem]">{title}</h3>
                  <p className="mx-auto mt-3 max-w-sm text-[0.9375rem] leading-6 text-white/72 sm:text-base">{text}</p>
                  <button onClick={() => openServiceInquiry(cta)} className="mt-7 inline-flex items-center gap-2 text-[0.9375rem] font-bold text-[#facb2e]">{cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></button>
                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-[#facb2e] transition-all duration-300 group-hover:w-full" />
                </article>
              ))}
            </div>
            <div id="reserva" className="scroll-mt-24 mt-12 max-sm:mt-8 sm:mt-14 lg:mt-10" aria-labelledby="reserva-title">
            <div className="max-w-3xl lg:max-w-none">
              <h2 id="reserva-title" className="cap-display text-4xl font-extrabold leading-[1.02] sm:text-5xl lg:whitespace-nowrap">Se preferir, reserve sua moeda antes de sair de casa.</h2>
            </div>
            <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {reservationSteps.map(({ index, title, text, icon: Icon }) => (
                <li key={index} className="group relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[.025] p-5 transition duration-200 hover:border-[#facb2e]/45 sm:p-6">
                  <div className="flex items-center justify-between gap-4"><span className="cap-display text-3xl font-extrabold text-[#facb2e]">{index}</span><span className="flex size-10 items-center justify-center rounded-full border border-[#facb2e]/25 bg-[#facb2e]/10 text-[#facb2e]"><Icon className="size-5" /></span></div>
                  <h3 className="mt-8 text-xl font-extrabold tracking-tight text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/70">{text}</p>
                  <div aria-hidden="true" className="absolute bottom-0 left-0 h-1 w-0 bg-[#facb2e] transition-all duration-300 group-hover:w-full" />
                </li>
              ))}
            </ol>
            </div>
          </div>
        </section>

        <section id="cotacoes" className="scroll-mt-24 border-y border-white/10 bg-[#070707] py-20 max-sm:py-10 sm:py-20 lg:py-5" aria-labelledby="cotacoes-title">
          <div className="container grid items-center gap-10 lg:grid-cols-[.94fr_1.06fr] lg:gap-16">
            <div className="relative flex min-h-[280px] items-center justify-center py-3 max-sm:hidden sm:min-h-[360px]">
              <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 480 360" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="cap-platform-geometry" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#facb2e" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#facb2e" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <circle cx="164" cy="146" r="108" fill="url(#cap-platform-geometry)" stroke="rgba(250,203,46,.34)" strokeWidth="1.5" />
                <circle cx="164" cy="146" r="67" fill="none" stroke="rgba(255,255,255,.13)" strokeWidth="1" />
                <rect x="324" y="32" width="112" height="150" rx="18" fill="rgba(255,255,255,.025)" stroke="rgba(250,203,46,.24)" strokeWidth="1.5" transform="rotate(-14 380 107)" />
                <path d="M 24 280 C 120 200, 206 292, 292 204 S 396 74, 462 110" fill="none" stroke="rgba(250,203,46,.46)" strokeWidth="1.5" strokeDasharray="5 10" />
                <circle cx="24" cy="280" r="5" fill="#facb2e" />
                <circle cx="462" cy="110" r="5" fill="#facb2e" />
                <path d="M 314 292 L 392 292" stroke="rgba(255,255,255,.19)" strokeWidth="1.5" />
                <path d="M 334 306 L 414 306" stroke="rgba(250,203,46,.34)" strokeWidth="1.5" />
              </svg>
              <img src={asset("plataforma-clientes.png")} alt="Plataforma de preços CAP Câmbio em computador e celular" className="relative z-10 w-[72%] max-w-[380px] object-contain drop-shadow-[0_22px_26px_rgba(0,0,0,.42)] sm:max-w-[400px]" />
            </div>
            <div className="max-w-2xl">
              <p className="cap-kicker text-[#facb2e]">CAP Cotações</p>
              <h2 id="cotacoes-title" className="cap-display mt-3 text-4xl font-extrabold leading-[1.02] sm:text-5xl">Acompanhe o câmbio com mais praticidade.</h2>
              <div className="relative mt-6 flex min-h-[220px] items-center justify-center py-2 sm:hidden">
                <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 480 360" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="cap-platform-geometry-mobile" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#facb2e" stopOpacity="0.16" />
                      <stop offset="100%" stopColor="#facb2e" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <circle cx="164" cy="146" r="108" fill="url(#cap-platform-geometry-mobile)" stroke="rgba(250,203,46,.34)" strokeWidth="1.5" />
                  <circle cx="164" cy="146" r="67" fill="none" stroke="rgba(255,255,255,.13)" strokeWidth="1" />
                  <rect x="324" y="32" width="112" height="150" rx="18" fill="rgba(255,255,255,.025)" stroke="rgba(250,203,46,.24)" strokeWidth="1.5" transform="rotate(-14 380 107)" />
                  <path d="M 24 280 C 120 200, 206 292, 292 204 S 396 74, 462 110" fill="none" stroke="rgba(250,203,46,.46)" strokeWidth="1.5" strokeDasharray="5 10" />
                  <circle cx="24" cy="280" r="5" fill="#facb2e" />
                  <circle cx="462" cy="110" r="5" fill="#facb2e" />
                </svg>
                <img src={asset("plataforma-clientes.png")} alt="Plataforma de preços CAP Câmbio em computador e celular" className="relative z-10 w-[72%] max-w-[320px] object-contain drop-shadow-[0_22px_26px_rgba(0,0,0,.42)]" />
              </div>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/75 sm:text-lg">Nossos clientes têm acesso exclusivo à CAP Cotações, uma plataforma para acompanhar nossas moedas em tempo real. Consulte gráficos e históricos, faça conversões e configure alertas personalizados para receber notificações.</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {["Cotações atualizadas", "Gráficos e histórico", "Alertas personalizados", "Conversor de moedas"].map(item => <div key={item} className="flex items-center gap-2 text-sm font-semibold text-white/78"><BadgeCheck className="size-4 shrink-0 text-[#facb2e]" />{item}</div>)}
              </div>
              <div className="mt-9"><div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center"><a href="/auth" target="_blank" rel="noreferrer" className="cap-cta inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-bold"><MonitorSmartphone className="size-4" />Acessar plataforma</a><a href={platformAccessWhatsApp} data-cap-whatsapp-message="Olá, sou cliente CAP e gostaria de solicitar acesso à plataforma de cotações." target="_blank" rel="noreferrer" className="cap-outline inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white/80">Solicitar acesso pelo WhatsApp <WhatsAppIcon className="size-4 text-[#facb2e]" /></a></div><p className="mt-5 max-w-xl text-xs font-bold leading-5 text-white/78">A plataforma é exclusiva para clientes autorizados pela equipe da CAP. Já é nosso cliente? Solicite seu acesso pelo WhatsApp.</p></div>
            </div>
          </div>
        </section>

        <section id="diferenciais" className="scroll-mt-24 border-y border-white/10 bg-black py-20 max-sm:py-10 sm:py-20 lg:py-5">
          <div className="container grid items-start gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-stretch lg:gap-16">
            <div>
              <div className="max-w-2xl">
                <p className="cap-kicker text-[#facb2e]">Por que a CAP</p>
                <h2 className="cap-display mt-3 text-4xl font-extrabold leading-[1.02] sm:text-5xl">Menos ruído. Mais precisão.</h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-white/75 sm:text-lg">O mercado já tem complexidade suficiente. Nosso trabalho é descomplicar suas operações.</p>
              </div>
              <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
                {differentials.map(({ index, title, text }) => (
                  <article key={index} className="grid gap-4 py-4 sm:grid-cols-[76px_1fr] sm:items-start sm:gap-6 sm:py-5">
                    <span className="cap-display text-3xl font-extrabold text-[#facb2e] sm:text-4xl">{index}</span>
                    <div><h3 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">{title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-white/70 sm:text-base">{text}</p></div>
                  </article>
                ))}
              </div>
            </div>
            <aside className="relative overflow-hidden rounded-[1.75rem] bg-[#facb2e] p-7 text-black shadow-[0_28px_70px_rgba(250,203,46,.12)] sm:p-9 lg:flex lg:self-stretch lg:flex-col lg:justify-center lg:p-10">
              <span aria-hidden="true" className="cap-display pointer-events-none absolute -bottom-3 right-4 select-none text-[8.5rem] font-black leading-none tracking-[-.15em] text-black/[.10] sm:-bottom-7 sm:right-6 sm:text-[12rem]">CAP</span>
              <div className="relative mt-6 lg:mt-0"><h3 className="cap-display max-w-md text-3xl font-extrabold leading-[1.04] sm:text-4xl">Seus planos não têm fronteiras, seu dinheiro também não.</h3><p className="mt-6 max-w-md text-base leading-7 text-black/70">Damos ao seu dinheiro o poder de se movimentar sem barreiras.</p></div>
            </aside>
          </div>
        </section>

        <section id="sobre" className="scroll-mt-24 py-20 max-sm:py-10 sm:py-20 lg:py-5">
          <div className="container grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
            <div className="order-2 relative lg:order-2"><div className="cap-grid absolute inset-0 rounded-[2rem] opacity-35" /><article className="cap-surface relative flex min-h-[360px] flex-col items-center overflow-hidden rounded-[2rem] border-2 border-[#facb2e]/75 p-7 text-center shadow-2xl sm:p-9"><div aria-hidden="true" className="pointer-events-none absolute inset-3 rounded-[1.35rem] border border-[#facb2e]/20" /><div className="relative inline-flex items-center gap-2 rounded-full border border-[#facb2e]/30 bg-[#facb2e]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-[#facb2e]"><ShieldCheck className="size-4" />Correspondente Cambial</div><div className="relative my-6 flex h-28 w-full items-center justify-center sm:h-32 lg:h-40"><img src={asset("invest-corretora.png")} alt="Invest Corretora" className="h-auto w-full max-w-[280px] object-contain lg:max-w-[360px] lg:scale-[1.3]" /></div><h3 className="cap-display relative text-lg font-extrabold uppercase sm:text-xl">INVEST SOCIEDADE CORRETORA DE CAMBIO LTDA</h3><p className="relative mt-3 max-w-xs text-xs leading-5 text-white/70">Atuação cambial orientada por segurança e transparência.</p></article></div>
            <div className="order-1 lg:order-1"><p className="cap-kicker text-[#facb2e]">Quem somos</p><div className="mt-3"><h2 className="cap-display text-4xl font-extrabold leading-[1.02] sm:text-5xl"><span className="block">Confiança não é</span>{" "}<span className="block">uma promessa.</span><span className="block lg:hidden">É uma prática</span><span className="block lg:hidden">diária.</span></h2></div><h2 className="cap-display mt-3 hidden text-4xl font-extrabold leading-[1.02] sm:text-5xl lg:block">É uma prática diária.</h2><p className="mt-7 max-w-xl text-base leading-7 text-white/75">Com duas décadas de história e uma base sólida de clientes no Rio Grande do Sul, a CAP Câmbio nasceu para oferecer mais do que moeda estrangeira: oferecemos a tranquilidade necessária para você planejar seus próximos passos. Cuidamos do seu câmbio com atenção a cada detalhe, acompanhando você do início ao fim da sua operação.</p></div>
          </div>
        </section>

        <section id="lojas" className="scroll-mt-24 bg-black py-20 max-sm:py-10 sm:py-20 lg:py-5">
	          <div className="container">
	            <div className="grid gap-10 xl:grid-cols-[.72fr_1.28fr] xl:items-start xl:gap-8">
	              <div>
	                <p className="cap-kicker text-[#facb2e]">Encontre a CAP Câmbio</p>
	                <h2 className="cap-display mt-3 max-w-3xl text-3xl font-extrabold leading-[1.08] sm:text-4xl xl:text-[2.15rem]">Dispomos de <span className="font-serif font-bold italic text-[#facb2e]">3 lojas</span> no Rio Grande do Sul.</h2>
<div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 lg:flex lg:flex-col lg:gap-3 xl:mt-5 xl:gap-[.625rem]" aria-label={activeTitle.full}>
		                  <span className="sr-only">{activeTitle.top} {activeTitle.bottom}</span>
		                  {rotatorTitles.map((title, titleIndex) => {
		                    const isActiveTitle = titleIndex === activeWordIndex;
		                    const positionClass = titleIndex === 0 ? "col-start-1 row-start-1 lg:col-auto lg:row-auto" : titleIndex === 1 ? "col-start-1 row-start-2 justify-self-start lg:col-auto lg:row-auto lg:justify-self-auto" : "col-start-2 row-start-1 lg:col-auto lg:row-auto";
		                    return (
		                      <button key={title.top} type="button" aria-label={title.full} aria-pressed={isActiveTitle} onMouseEnter={() => selectOffice(titleIndex)} onFocus={() => selectOffice(titleIndex)} onClick={() => selectOffice(titleIndex)} className={`cap-display block w-fit select-none text-left transition-opacity duration-500 ease-out motion-reduce:transition-none ${positionClass} ${isActiveTitle ? "opacity-100" : "opacity-[.35]"}`}>
		                        <span className="text-hero-xl block whitespace-nowrap text-white xl:text-[clamp(1.9rem,5.6vw,4.15rem)]">{title.top}</span>
		                        <span className="text-hero-xl block whitespace-nowrap text-[#facb2e] xl:text-[clamp(1.9rem,5.6vw,4.15rem)]">{title.bottom}</span>
		                      </button>
		                    );
		                  })}
		                </div>
	              </div>

		              <article className="group overflow-hidden rounded-[1.75rem] border border-white/[.06] bg-white/[.025] shadow-[0_24px_65px_rgba(0,0,0,.22)]">
	                <div className="relative aspect-[16/9] overflow-hidden bg-[#0d0d0b] xl:aspect-[15/8]">
	                  <img key={`${activeOffice.city}-backdrop`} src={activeOffice.photo} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover object-center opacity-35 blur-2xl" />
	                  <div aria-hidden="true" className="absolute inset-0 bg-black/45" />
	                  <img key={activeOffice.city} src={activeOffice.photo} alt={`Fachada da unidade CAP Câmbio de ${activeOffice.city}`} className="relative z-10 h-full w-full object-contain object-center transition-transform duration-700 group-hover:scale-[1.03]" />
	                  <div aria-hidden="true" className="absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,.12)_52%,rgba(0,0,0,.82)_100%)]" />
		                  <div aria-hidden="true" className="absolute inset-0 z-20 bg-[linear-gradient(180deg,rgba(0,0,0,.18)_0%,transparent_28%,rgba(0,0,0,.25)_55%,rgba(0,0,0,.96)_100%)]" />
	                  <div className={`absolute right-3 ${activeOffice.hoursPanelTop} z-30 hidden w-[190px] rounded-xl border border-white/10 bg-black/75 p-3 text-xs text-white/80 shadow-xl backdrop-blur-md xl:block`}><div className="flex items-center gap-2 font-bold text-white"><Clock3 className="size-3.5 shrink-0 text-[#facb2e]" />Horários</div><ul className="mt-2 grid gap-1.5">{activeOffice.hours.map(hour => { const [day, time] = hour.split(": "); return <li key={hour} className="flex items-start justify-between gap-3 leading-4"><span className="text-white/64">{day}</span><span className="shrink-0 text-right font-semibold text-white">{time}</span></li>; })}</ul></div>
		                  <div className="absolute inset-x-0 bottom-0 z-30 p-4 sm:p-5 xl:p-[1.125rem]"><p className="cap-kicker text-[#facb2e]">Unidade em destaque</p><h3 className="cap-display mt-1 text-2xl font-extrabold sm:text-3xl xl:text-[1.75rem]">{activeOffice.city}</h3>{activeOffice.dhlAuthorized ? <div aria-label="Agente Autorizado DHL" className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#facb2e]/40 bg-black/65 px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[.08em] text-[#facb2e] backdrop-blur-sm"><span>Agente autorizado</span><span aria-hidden="true" className="h-3 w-px bg-[#facb2e]/35" /><img src={asset("dhl-horizontal.png")} alt="DHL" className="h-3.5 w-auto object-contain" /></div> : null}</div>
	                </div>
	                <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.15fr_.85fr] xl:gap-3.5 xl:p-[1.125rem]">
	                  <div>
                    <div className="flex items-start gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-[#facb2e]" /><p className="text-sm leading-6 text-white/75 xl:text-[.8125rem] xl:leading-5">{activeOffice.address}</p></div>
	                    <div className="mt-3 flex items-start gap-2 text-xs text-white/80 xl:mt-2.5 xl:hidden"><Clock3 className="mt-0.5 size-3.5 shrink-0 text-[#facb2e]" /><div><p className="font-semibold">Horários de atendimento</p><ul className="mt-1 grid gap-0.5 leading-5 text-white/72">{activeOffice.hours.map(hour => <li key={hour}>{hour}</li>)}</ul></div></div>
	                    <div className="mt-4 flex flex-wrap gap-2 xl:mt-3.5">
                      <a href={`tel:${activeOffice.phone.replace(/\D/g, "")}`} className="cap-outline inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold text-white/80"><Phone className="size-3.5 text-[#facb2e]" />{activeOffice.phone}</a>
                      <a href={activeOffice.whatsappLink} data-cap-whatsapp-direct target="_blank" rel="noreferrer" className="cap-outline inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold text-white/80"><MessageCircle className="size-3.5 text-[#facb2e]" />{activeOffice.whatsapp}</a>
	                    </div>
                    <a href={`mailto:${activeOffice.email}`} className="mt-3 inline-flex max-w-full items-center gap-2 text-sm text-white/72 transition hover:text-[#facb2e] xl:mt-2.5 xl:text-[.8125rem]"><Mail className="size-4 shrink-0 text-[#facb2e]" /><span className="truncate">{activeOffice.email}</span></a>
	                  </div>
	                  <div className="flex flex-col justify-end gap-2 xl:gap-1.5">
	                    <a href={activeOffice.whatsappLink} data-cap-whatsapp-direct target="_blank" rel="noreferrer" className="cap-cta inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold xl:py-[.55rem] xl:text-[.8125rem]">Conversar no WhatsApp <MessageCircle className="size-4" /></a>
	                    <a href={activeOffice.map} target="_blank" rel="noreferrer" className="cap-outline inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold xl:py-[.55rem] xl:text-[.8125rem]">Como chegar <ExternalLink className="size-4 text-[#facb2e]" /></a>
	                  </div>
	                </div>
	              </article>
	            </div>
	          </div>
	        </section>

        <ArchivedFaq whatsappUrl={whatsappCaxias} />
      </main>

      <footer className="border-t border-white/10 bg-[#070707] pb-8 pt-14 lg:pt-8">
        <div className="container">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <div id="legal" className="flex flex-col items-center text-center">
              <img src={capLogoUrl} alt="CAP Câmbio" className="h-20 w-auto object-contain" />
              <div className="mt-5 flex flex-col gap-2 text-sm font-semibold text-[#facb2e]"><a href="/privacidade">Políticas de Privacidade</a><a href="/termos">Termos de uso</a></div>
            </div>
            <div>
              <p className="cap-kicker text-white/42">Navegação</p>
              <div className="mt-4 grid grid-cols-[auto_auto] gap-x-6 gap-y-3 text-sm text-white/65"><div className="flex flex-col gap-3">{[["Serviços", "servicos"], ["CAP Cotações", "cotacoes"], ["Sobre nós", "sobre"]].map(([label, id]) => <button key={id} onClick={() => scrollToId(id)} className="w-fit text-left hover:text-[#facb2e]">{label}</button>)}</div><div className="flex flex-col gap-3">{[["Lojas", "lojas"], ["FAQ", "faq"]].map(([label, id]) => <button key={id} onClick={() => scrollToId(id)} className="w-fit text-left hover:text-[#facb2e]">{label}</button>)}</div></div>
            </div>
            <div>
              <p className="cap-kicker text-white/42">Canais oficiais</p>
              <div className="mt-4 grid gap-3 text-sm text-white/65">
                <a href={footerWhatsApp} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-[#facb2e]"><MessageCircle className="size-4" />WhatsApp</a>
                <a href="mailto:capcambio_caxias@hotmail.com" className="flex items-center gap-2 hover:text-[#facb2e]"><Mail className="size-4" />E-mail</a>
                <a href="tel:+555432232000" className="flex items-center gap-2 hover:text-[#facb2e]"><Phone className="size-4" />Telefone</a>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/34 sm:flex-row"><p>© {new Date().getFullYear()} CAP Câmbio. Todos os direitos reservados.</p><p>Desenvolvido para uma experiência mais clara e segura.</p></div>
        </div>
      </footer>

    </div>
  );
}
