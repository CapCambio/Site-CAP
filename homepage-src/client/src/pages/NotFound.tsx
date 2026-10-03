import { ArrowLeft, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

const capLogoUrl = `${import.meta.env.BASE_URL}assets/cap-logo.png`;

export default function NotFound() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,rgba(250,203,46,.13),transparent_24rem)]" />
      <section className="relative z-10 w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[.025] p-7 text-center shadow-[0_28px_80px_rgba(0,0,0,.45)] backdrop-blur-sm sm:p-10">
        <img src={capLogoUrl} alt="CAP Câmbio" className="mx-auto h-16 w-auto object-contain" />
        <p className="cap-kicker mt-10 text-[#facb2e]">{t('notFound.kicker')}</p>
        <h1 className="cap-display mt-3 text-6xl font-extrabold leading-none sm:text-7xl">404</h1>
        <h2 className="cap-display mt-5 text-2xl font-extrabold sm:text-3xl">{t('notFound.heading')}</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/58 sm:text-base">{t('notFound.description')}</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={() => setLocation("/")} className="cap-cta inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold"><ArrowLeft className="size-4" />{t('notFound.backHome')}</button>
          <button onClick={() => setLocation("/#contato")} className="cap-outline inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold"><MapPin className="size-4 text-[#facb2e]" />{t('notFound.contactCAP')}</button>
        </div>
      </section>
    </main>
  );
}
