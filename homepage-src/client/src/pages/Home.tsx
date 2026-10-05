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
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { getNextRotatorIndex, isRotatorAutoplayActive, rotatorAutoplayDuration, rotatorTitles } from "@shared/cityRotator";

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`;
const capLogoUrl = asset("cap-logo.png");
const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M20.25 11.62a8.17 8.17 0 0 1-12.06 7.2L4 20l1.22-4.02A8.17 8.17 0 1 1 20.25 11.62Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.05 7.92c.18-.4.37-.4.55-.4h.47c.15 0 .35.06.45.31l.7 1.67c.08.2.05.4-.08.58l-.36.48c-.1.14-.2.25-.08.45.1.18.51.82 1.1 1.33.76.68 1.4.9 1.6 1 .2.1.31.08.43-.05l.54-.64c.13-.16.27-.13.45-.07l1.74.82c.22.1.36.16.41.26.05.11.05.63-.15 1.22-.2.58-1.16 1.1-1.6 1.16-.4.05-.9.07-1.45-.1a6.66 6.66 0 0 1-1.36-.5 10.93 10.93 0 0 1-4.47-3.95 5.1 5.1 0 0 1-1.07-2.71c0-.8.42-1.19.57-1.36Z" fill="currentColor" />
    </svg>
  );
}

function BoldParts({ parts }: { parts: string[] }) {
  return <>{parts.map((p: string, i: number) => i % 2 === 1 ? <strong key={i} className="font-extrabold text-white/85">{p}</strong> : <span key={i}>{p}</span>)}</>;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [isRotatorPaused, setIsRotatorPaused] = useState(false);

  useEffect(() => {
    if (!isRotatorAutoplayActive(isRotatorPaused)) return;

    const rotation = window.setInterval(() => {
      setActiveWordIndex(currentIndex => getNextRotatorIndex(currentIndex));
    }, rotatorAutoplayDuration);

    return () => window.clearInterval(rotation);
  }, [isRotatorPaused]);

  const { t, i18n } = useTranslation();

  const langs: [string, string][] = [['pt', 'PT'], ['en', 'EN'], ['es', 'ES'], ['fr', 'FR']];
  const changeLang = (code: string) => { i18n.changeLanguage(code); localStorage.setItem('preferred_language', code); setLangOpen(false); };

  const waPhone = '5554984348005';
  const waUrl = (msg: string) => `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(msg)}`;

  const offices = [
    { city: "Caxias do Sul", address: "Rua Borges Medeiros 391, Loja 8 · Hipermercado Zaffari · Centro", phone: "(54) 3223.2000", whatsapp: "(54) 98434.8005", email: "capcambio_caxias@hotmail.com", map: "https://www.google.com/maps/search/?api=1&query=Rua+Borges+Medeiros+391+Caxias+do+Sul+RS", photo: asset("caxias.png"), hoursPanelTop: "top-[18rem]", hours: [{ day: t('home.hours.weekday'), time: '9h – 20h' }, { day: t('home.hours.saturday'), time: '10h – 20h' }, { day: t('home.hours.sunday'), time: t('home.hours.closed') }], dhlAuthorized: false },
    { city: "Bento Gonçalves", address: "Rua Treze de Maio 877, Loja 204 · Shopping Lá América · São Bento", phone: "(54) 3453.5060", whatsapp: "(54) 99957.8486", email: "capcambio_bento@hotmail.com", map: "https://www.google.com/maps/search/?api=1&query=Rua+Treze+de+Maio+877+Bento+Goncalves+RS", photo: asset("bento.png"), hoursPanelTop: "top-[17rem]", hours: [{ day: t('home.hours.weekday'), time: '10h – 20h' }, { day: t('home.hours.saturday'), time: '10h – 19h' }, { day: t('home.hours.sunday'), time: t('home.hours.closed') }], dhlAuthorized: true },
    { city: "Passo Fundo", address: "Av. Brasil Leste 200, Loja 40 · Shopping Bourbon · Petrópolis", phone: "(54) 3046.0088", whatsapp: "(54) 99628.0422", email: "capcambio_passo@hotmail.com", map: "https://www.google.com/maps/search/?api=1&query=Av+Brasil+Leste+200+Passo+Fundo+RS", photo: asset("passo.png"), hoursPanelTop: "top-[18rem]", hours: [{ day: t('home.hours.weekdaySat'), time: '10h – 20h' }, { day: t('home.hours.sunday'), time: t('home.hours.closed') }], dhlAuthorized: true },
  ].map(o => ({ ...o, whatsappLink: waUrl(t('home.whatsappGeneral')) }));

  const services = [
    { icon: Banknote, image: asset("icone-dinheiro.png"), imageSize: "h-[5.1rem]", title: t('home.services.s1title'), text: t('home.services.s1text'), cta: t('home.services.s1cta'), msgKey: 'whatsappCurrency' },
    { icon: BriefcaseBusiness, image: asset("remessa-expressa.png"), imageSize: "h-16", title: t('home.services.s2title'), textParts: t('home.services.s2textParts', { returnObjects: true }) as string[], cta: t('home.services.s2cta'), msgKey: 'whatsappTransfer' },
    { icon: Globe2, image: asset("dhl-horizontal.png"), imageSize: "h-14", title: t('home.services.s3title'), textParts: t('home.services.s3textParts', { returnObjects: true }) as string[], cta: t('home.services.s3cta'), msgKey: 'whatsappShipping' },
  ];

  const differentials = [
    { index: "01", title: t('home.diff.d1title'), text: t('home.diff.d1text') },
    { index: "02", title: t('home.diff.d2title'), text: t('home.diff.d2text') },
    { index: "03", title: t('home.diff.d3title'), text: t('home.diff.d3text') },
  ];

  const reservationSteps = [
    { index: "01", title: t('home.services.r1title'), text: t('home.services.r1text'), icon: MessageCircle },
    { index: "02", title: t('home.services.r2title'), text: t('home.services.r2text'), icon: CircleDollarSign },
    { index: "03", title: t('home.services.r3title'), text: t('home.services.r3text'), icon: WalletCards },
    { index: "04", title: t('home.services.r4title'), text: t('home.services.r4text'), icon: MapPin },
  ];

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

  const openServiceInquiry = (msgKey: string, hideCaxias: boolean) => {
    window.dispatchEvent(new CustomEvent("cap:open-whatsapp", { detail: { hideCaxias, message: t(`home.${msgKey}`) } }));
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#facb2e] selection:text-black">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="container flex h-[76px] items-center justify-between gap-5">
          <button onClick={() => scrollToId("inicio")} className="group flex shrink-0 items-center text-left" aria-label={t('home.nav.goToStart')}>
            <img src={capLogoUrl} alt="CAP Câmbio" className="h-16 w-auto object-contain sm:h-[4.5rem]" />
          </button>
          <nav className="hidden items-center gap-6 lg:flex" aria-label={t('home.stores.mainNav')}>
            {[[t('home.nav.services'),"servicos"],[t('home.nav.quotes'),"cotacoes"],[t('home.nav.about'),"sobre"],[t('home.nav.stores'),"lojas"],["FAQ","faq"]].map(([label, id]) => <button key={id} onClick={() => scrollToId(id)} className="cap-nav-link text-sm font-medium">{label}</button>)}
          </nav>
          <div className="hidden items-center gap-3 sm:flex">
            <div className="relative"><button onClick={() => setLangOpen(v => !v)} className="cap-outline inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold" aria-label="Language"><Globe2 className="size-3.5" />{i18n.language.toUpperCase().slice(0,2)}</button>{langOpen && <div className="absolute right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl">{langs.map(([code, label]) => <button key={code} onClick={() => changeLang(code)} className={`block w-full px-4 py-2 text-left text-xs font-bold transition hover:bg-white/5 ${i18n.language === code ? 'text-[#facb2e]' : 'text-white'}`}>{label}</button>)}</div>}</div>
            <a href={waUrl(t('home.whatsappGeneral'))} target="_blank" rel="noreferrer" className="cap-cta inline-flex items-center gap-1 rounded-full px-4 py-2.5 text-sm font-bold"><WhatsAppIcon className="size-4" />{t('home.nav.talkToUs')}</a>
          </div>
          <div className="relative lg:hidden"><button onClick={() => setLangOpen(v => !v)} className="cap-outline inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold" aria-label="Language"><Globe2 className="size-3.5" />{i18n.language.toUpperCase().slice(0,2)}</button>{langOpen && <div className="absolute right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl">{langs.map(([code, label]) => <button key={code} onClick={() => changeLang(code)} className={`block w-full px-4 py-2 text-left text-xs font-bold transition hover:bg-white/5 ${i18n.language === code ? 'text-[#facb2e]' : 'text-white'}`}>{label}</button>)}</div>}</div>
          <button onClick={() => setMenuOpen(current => !current)} className="rounded-lg p-2 text-white lg:hidden" aria-label={t('home.nav.openMenu')} aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
        {menuOpen && <div className="border-t border-white/10 bg-black px-4 py-4 lg:hidden"><nav className="container grid gap-1" aria-label={t('home.stores.mobileNav')}>{[[t('home.nav.services'),"servicos"],[t('home.nav.quotes'),"cotacoes"],[t('home.nav.about'),"sobre"],[t('home.nav.stores'),"lojas"],["FAQ","faq"]].map(([label, id]) => <button key={id} onClick={() => navigate(id)} className="rounded-lg px-3 py-3 text-left text-sm font-semibold text-white/80 hover:bg-white/5">{label}</button>)}<a href={waUrl(t('home.whatsappGeneral'))} target="_blank" rel="noreferrer" className="cap-cta mt-2 inline-flex items-center justify-center gap-1 rounded-lg px-3 py-3 text-center text-sm font-bold"><WhatsAppIcon className="size-4" />{t('home.nav.talkToUs')}</a></nav></div>}
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
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#facb2e]/25 bg-[#facb2e]/10 px-3 py-1.5 text-xs font-bold text-[#facb2e]"><span className="cap-pulse h-1.5 w-1.5 rounded-full bg-[#facb2e]" />{t('home.hero.since')}</div>
              <h1 className="cap-display max-w-[680px] text-5xl font-extrabold leading-[.95] text-white sm:text-6xl lg:text-7xl">{t('home.hero.title1')} <span className="text-[#facb2e]">{t('home.hero.title2')}</span></h1>
              <p className="mt-7 max-w-[600px] text-base leading-7 text-white/75 sm:text-lg">{t('home.hero.subtitle')}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row"><span aria-hidden="true" className="invisible inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold lg:hidden">Encontre sua solução <ArrowDownRight className="size-4" /></span><a href={waUrl(t('home.whatsappCurrency'))} data-cap-whatsapp-message={t('home.whatsappCurrency')} target="_blank" rel="noreferrer" className="cap-cta inline-flex h-12 items-center justify-center gap-1 rounded-full px-6 text-sm font-bold"><WhatsAppIcon className="size-4" />{t('home.hero.cta')}</a></div>
              <div className="mx-auto mt-5 flex w-fit min-w-[282px] items-center justify-center gap-2 rounded-xl border border-[#facb2e]/30 bg-black/60 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm lg:hidden"><BadgeCheck className="size-4 shrink-0 text-[#facb2e]" /><span className="whitespace-nowrap">{t('home.hero.trust1')} {t('home.hero.trust2')}</span></div>
            </div>
            <div className="hidden lg:relative lg:z-auto lg:mx-0 lg:block lg:w-full lg:max-w-[410px] lg:translate-x-10 lg:overflow-visible">
              <div className="cap-float relative overflow-hidden bg-black lg:aspect-[.78]">
                <img src={asset("janela-paris.jpeg")} alt={t('home.altParisWindow')} className="h-full w-full object-cover object-center" />
                <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,#000_0%,transparent_17%,transparent_78%,#000_100%)]" />
                <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,#000_0%,transparent_14%,transparent_76%,#000_100%)]" />
              </div>
              <div className="absolute -left-28 top-[62%] hidden rounded-xl border border-[#facb2e]/30 bg-black px-4 py-3 text-sm font-semibold shadow-2xl sm:flex sm:items-center sm:gap-3"><BadgeCheck className="size-6 text-[#facb2e]" /><span>{t('home.hero.trust1')}<br /><span className="text-white/55">{t('home.hero.trust2')}</span></span></div>
            </div>
          </div>
        </section>

        <section id="servicos" className="scroll-mt-24 bg-[#0d0d0b] py-20 max-sm:py-10 sm:py-20 lg:pb-5 lg:pt-0">
          <div className="container">
            <div className="max-w-2xl"><p className="cap-kicker text-[#facb2e]">{t('home.services.kicker')}</p><h2 className="cap-display mt-3 text-4xl font-extrabold sm:text-5xl">{t('home.services.title')}</h2></div>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {services.map(({ icon: Icon, image, imageSize, title, text, textParts, cta, msgKey }, index) => (
                <article key={`${title}-${index}`} className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black p-7 text-center transition duration-200 hover:border-[#facb2e]/45">
                  <div className={`mt-2 flex items-center justify-center ${image ? imageSize ?? "h-12" : "h-12"}`}>
                    {image ? <img src={image} alt={title} className={`${imageSize ?? "h-12"} w-auto max-w-full rounded-lg object-contain`} /> : <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#facb2e] text-black"><Icon className="size-6" /></div>}
                  </div>
                  <h3 className="cap-display mt-7 text-[1.65rem] font-extrabold leading-[1.05] sm:text-[1.75rem]">{title}</h3>
                  <p className="mx-auto mt-3 max-w-sm text-[0.9375rem] leading-6 text-white/72 sm:text-base">{textParts ? <BoldParts parts={textParts} /> : text}</p>
                  <button onClick={() => openServiceInquiry(msgKey, msgKey === 'whatsappShipping')} className="mt-7 inline-flex items-center gap-2 text-[0.9375rem] font-bold text-[#facb2e]">{cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></button>
                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-[#facb2e] transition-all duration-300 group-hover:w-full" />
                </article>
              ))}
            </div>
            <div id="reserva" className="scroll-mt-24 mt-12 max-sm:mt-8 sm:mt-14 lg:mt-10" aria-labelledby="reserva-title">
            <div className="max-w-3xl lg:max-w-none">
              <h2 id="reserva-title" className="cap-display text-4xl font-extrabold leading-[1.02] sm:text-5xl lg:whitespace-nowrap">{t('home.services.reserveTitle')}</h2>
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
              <img src={asset("plataforma-clientes.png")} alt={t('home.altPlatform')} className="relative z-10 w-[72%] max-w-[380px] object-contain drop-shadow-[0_22px_26px_rgba(0,0,0,.42)] sm:max-w-[400px]" />
            </div>
            <div className="max-w-2xl">
              <p className="cap-kicker text-[#facb2e]">{t('home.platform.kicker')}</p>
              <h2 id="cotacoes-title" className="cap-display mt-3 text-4xl font-extrabold leading-[1.02] sm:text-5xl">{t('home.platform.title')}</h2>
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
                <img src={asset("plataforma-clientes.png")} alt={t('home.altPlatform')} className="relative z-10 w-[72%] max-w-[320px] object-contain drop-shadow-[0_22px_26px_rgba(0,0,0,.42)]" />
              </div>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/75 sm:text-lg">{t('home.platform.desc')}</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[t('home.platform.f1'), t('home.platform.f2'), t('home.platform.f3'), t('home.platform.f4')].map(item => <div key={item} className="flex items-center gap-2 text-sm font-semibold text-white/78"><BadgeCheck className="size-4 shrink-0 text-[#facb2e]" />{item}</div>)}
              </div>
              <div className="mt-9"><div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center"><a href="/auth" target="_blank" rel="noreferrer" className="cap-cta inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-bold"><MonitorSmartphone className="size-4" />{t('home.platform.access')}</a><a href={waUrl(t('home.whatsappPlatform'))} data-cap-whatsapp-message={t('home.whatsappPlatform')} target="_blank" rel="noreferrer" className="cap-outline inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white/80">{t('home.platform.requestWhats')} <WhatsAppIcon className="size-4 text-[#facb2e]" /></a></div><p className="mt-5 max-w-xl text-xs font-bold leading-5 text-white/78">{t('home.platform.exclusive')}</p></div>
            </div>
          </div>
        </section>

        <section id="diferenciais" className="scroll-mt-24 border-y border-white/10 bg-black py-20 max-sm:py-10 sm:py-20 lg:py-5">
          <div className="container grid items-start gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-stretch lg:gap-16">
            <div>
              <div className="max-w-2xl">
                <p className="cap-kicker text-[#facb2e]">{t('home.diff.kicker')}</p>
                <h2 className="cap-display mt-3 text-4xl font-extrabold leading-[1.02] sm:text-5xl">{t('home.diff.title')}</h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-white/75 sm:text-lg">{t('home.diff.subtitle')}</p>
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
              <div className="relative mt-6 lg:mt-0"><h3 className="cap-display max-w-md text-3xl font-extrabold leading-[1.04] sm:text-4xl">{t('home.diff.bannerTitle')}</h3><p className="mt-6 max-w-md text-base leading-7 text-black/70">{t('home.diff.bannerText')}</p></div>
            </aside>
          </div>
        </section>

        <section id="sobre" className="scroll-mt-24 py-20 max-sm:py-10 sm:py-20 lg:py-5">
          <div className="container grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
            <div className="order-2 relative lg:order-2"><div className="cap-grid absolute inset-0 rounded-[2rem] opacity-35" /><article className="cap-surface relative flex min-h-[360px] flex-col items-center overflow-hidden rounded-[2rem] border-2 border-[#facb2e]/75 p-7 text-center shadow-2xl sm:p-9"><div aria-hidden="true" className="pointer-events-none absolute inset-3 rounded-[1.35rem] border border-[#facb2e]/20" /><div className="relative inline-flex items-center gap-2 rounded-full border border-[#facb2e]/30 bg-[#facb2e]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-[#facb2e]"><ShieldCheck className="size-4" />{t('home.about.partnerLabel')}</div><div className="relative my-6 flex h-28 w-full items-center justify-center sm:h-32 lg:h-40"><img src={asset("invest-corretora.png")} alt="Invest Corretora" className="h-auto w-full max-w-[280px] object-contain lg:max-w-[360px] lg:scale-[1.3]" /></div><h3 className="cap-display relative text-lg font-extrabold uppercase sm:text-xl">INVEST SOCIEDADE CORRETORA DE CAMBIO LTDA</h3><p className="relative mt-3 max-w-xs text-xs leading-5 text-white/70">{t('home.about.partnerDesc')}</p></article></div>
            <div className="order-1 lg:order-1"><p className="cap-kicker text-[#facb2e]">{t('home.about.kicker')}</p><div className="mt-3"><h2 className="cap-display text-4xl font-extrabold leading-[1.02] sm:text-5xl"><span className="block">{t('home.about.title1')}</span>{" "}<span className="block">{t('home.about.title2')}</span><span className="block lg:hidden">{t('home.about.title3').split(' ').slice(0, -1).join(' ')}</span><span className="block lg:hidden">{t('home.about.title3').split(' ').slice(-1)}</span></h2></div><h2 className="cap-display mt-3 hidden text-4xl font-extrabold leading-[1.02] sm:text-5xl lg:block">{t('home.about.title3')}</h2><p className="mt-7 max-w-xl text-base leading-7 text-white/75">{t('home.about.desc')}</p></div>
          </div>
        </section>

        <section id="lojas" className="scroll-mt-24 bg-black py-20 max-sm:py-10 sm:py-20 lg:py-5">
	          <div className="container">
	            <div className="grid gap-10 xl:grid-cols-[.72fr_1.28fr] xl:items-start xl:gap-8">
	              <div>
	                <p className="cap-kicker text-[#facb2e]">{t('home.stores.kicker')}</p>
	                <h2 className="cap-display mt-3 max-w-3xl text-3xl font-extrabold leading-[1.08] sm:text-4xl xl:text-[2.15rem]">{t('home.stores.title1')} <span className="font-serif font-bold italic text-[#facb2e]">{t('home.stores.titleHighlight')}</span> {t('home.stores.title2')}</h2>
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
	                  <img key={activeOffice.city} src={activeOffice.photo} alt={`${t('home.stores.facade')} ${activeOffice.city}`} className="relative z-10 h-full w-full object-contain object-center transition-transform duration-700 group-hover:scale-[1.03]" />
	                  <div aria-hidden="true" className="absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,.12)_52%,rgba(0,0,0,.82)_100%)]" />
		                  <div aria-hidden="true" className="absolute inset-0 z-20 bg-[linear-gradient(180deg,rgba(0,0,0,.18)_0%,transparent_28%,rgba(0,0,0,.25)_55%,rgba(0,0,0,.96)_100%)]" />
	                  <div className={`absolute right-3 ${activeOffice.hoursPanelTop} z-30 hidden w-[190px] rounded-xl border border-white/10 bg-black/75 p-3 text-xs text-white/80 shadow-xl backdrop-blur-md xl:block`}><div className="flex items-center gap-2 font-bold text-white"><Clock3 className="size-3.5 shrink-0 text-[#facb2e]" />{t('home.stores.hours')}</div><ul className="mt-2 grid gap-1.5">{activeOffice.hours.map(hour => <li key={hour.day} className="flex items-start justify-between gap-3 leading-4"><span className="text-white/64">{hour.day}</span><span className="shrink-0 text-right font-semibold text-white">{hour.time}</span></li>)}</ul></div>
		                  <div className="absolute inset-x-0 bottom-0 z-30 p-4 sm:p-5 xl:p-[1.125rem]"><p className="cap-kicker text-[#facb2e]">{t('home.stores.featured')}</p><h3 className="cap-display mt-1 text-2xl font-extrabold sm:text-3xl xl:text-[1.75rem]">{activeOffice.city}</h3>{activeOffice.dhlAuthorized ? <div aria-label={t('home.stores.authorizedDhl')} className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#facb2e]/40 bg-black/65 px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[.08em] text-[#facb2e] backdrop-blur-sm"><span>{t('home.stores.authorizedAgent')}</span><span aria-hidden="true" className="h-3 w-px bg-[#facb2e]/35" /><img src={asset("dhl-horizontal.png")} alt="DHL" className="h-3.5 w-auto object-contain" /></div> : null}</div>
	                </div>
	                <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.15fr_.85fr] xl:gap-3.5 xl:p-[1.125rem]">
	                  <div>
                    <div className="flex items-start gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-[#facb2e]" /><p className="text-sm leading-6 text-white/75 xl:text-[.8125rem] xl:leading-5">{activeOffice.address}</p></div>
	                    <div className="mt-3 flex items-start gap-2 text-xs text-white/80 xl:mt-2.5 xl:hidden"><Clock3 className="mt-0.5 size-3.5 shrink-0 text-[#facb2e]" /><div><p className="font-semibold">{t('home.stores.serviceHours')}</p><ul className="mt-1 grid gap-0.5 leading-5 text-white/72">{activeOffice.hours.map(hour => <li key={hour.day}>{hour.day} {hour.time}</li>)}</ul></div></div>
	                    <div className="mt-4 flex flex-wrap gap-2 xl:mt-3.5">
                      <a href={`tel:${activeOffice.phone.replace(/\D/g, "")}`} className="cap-outline inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold text-white/80"><Phone className="size-3.5 text-[#facb2e]" />{activeOffice.phone}</a>
                      <a href={activeOffice.whatsappLink} data-cap-whatsapp-direct target="_blank" rel="noreferrer" className="cap-outline inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold text-white/80"><MessageCircle className="size-3.5 text-[#facb2e]" />{activeOffice.whatsapp}</a>
	                    </div>
                    <a href={`mailto:${activeOffice.email}`} className="mt-3 inline-flex max-w-full items-center gap-2 text-sm text-white/72 transition hover:text-[#facb2e] xl:mt-2.5 xl:text-[.8125rem]"><Mail className="size-4 shrink-0 text-[#facb2e]" /><span className="truncate">{activeOffice.email}</span></a>
	                  </div>
	                  <div className="flex flex-col justify-end gap-2 xl:gap-1.5">
	                    <a href={activeOffice.whatsappLink} data-cap-whatsapp-direct target="_blank" rel="noreferrer" className="cap-cta inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold xl:py-[.55rem] xl:text-[.8125rem]">{t('home.stores.chatWhats')} <MessageCircle className="size-4" /></a>
	                    <a href={activeOffice.map} target="_blank" rel="noreferrer" className="cap-outline inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold xl:py-[.55rem] xl:text-[.8125rem]">{t('home.stores.directions')} <ExternalLink className="size-4 text-[#facb2e]" /></a>
	                  </div>
	                </div>
	              </article>
	            </div>
	          </div>
	        </section>

        <ArchivedFaq whatsappUrl={waUrl(t('home.whatsappGeneral'))} />
      </main>

      <footer className="border-t border-white/10 bg-[#070707] pb-8 pt-14 lg:pt-8">
        <div className="container">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center text-center">
              <img src={capLogoUrl} alt="CAP Câmbio" className="h-20 w-auto object-contain" />
            </div>
            <div>
              <p className="cap-kicker text-white/42">{t('home.footerNav.title')}</p>
              <div className="mt-4 grid gap-3 text-sm text-white/65">{[[t('home.nav.services'),"servicos"],[t('home.nav.quotes'),"cotacoes"],[t('home.footerNav.aboutUs'),"sobre"],[t('home.nav.stores'),"lojas"],["FAQ","faq"]].map(([label, id]) => <button key={id} onClick={() => scrollToId(id)} className="w-fit text-left hover:text-[#facb2e]">{label}</button>)}</div>
            </div>
            <div>
              <p className="cap-kicker text-white/42">{t('home.footerChannels')}</p>
              <div className="mt-4 grid gap-3 text-sm text-white/65">
                <a href={waUrl(t('home.whatsappFooter'))} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-[#facb2e]"><MessageCircle className="size-4" />WhatsApp</a>
                <a href="mailto:capcambio_caxias@hotmail.com" className="flex items-center gap-2 hover:text-[#facb2e]"><Mail className="size-4" />E-mail</a>
                <a href="tel:+555432232000" className="flex items-center gap-2 hover:text-[#facb2e]"><Phone className="size-4" />{t('home.channelPhone')}</a>
              </div>
            </div>
            <div id="legal">
              <div className="flex flex-col gap-2 text-sm font-semibold text-[#facb2e]"><a href="/privacidade">{t('legal.privacy.kicker')}</a><a href="/termos">{t('legal.terms.kicker')}</a></div>
            </div>
          </div>
          <div className="mt-12 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/34 sm:flex-row"><p>© {new Date().getFullYear()} CAP Câmbio. {t('footer.copyright')}</p><p>{t('home.footerTagline')}</p></div>
        </div>
      </footer>

    </div>
  );
}
