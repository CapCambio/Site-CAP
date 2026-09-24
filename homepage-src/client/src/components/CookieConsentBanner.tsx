import { useEffect, useState } from "react";
import { cookieConsentEventName, hasCookiePreference, rememberCookieConsent } from "@/lib/cookieConsent";

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      setIsVisible(!hasCookiePreference(window.localStorage));
    } catch {
      setIsVisible(true);
    }
  }, []);

  const saveCookiePreference = (choice: "accepted" | "declined") => {
    try {
      rememberCookieConsent(window.localStorage, choice);
    } catch {
      // O banner ainda desaparece quando o armazenamento local está indisponível.
    }
    window.dispatchEvent(new CustomEvent(cookieConsentEventName, { detail: { choice } }));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <section aria-label="Consentimento de cookies" role="dialog" aria-live="polite" className="fixed inset-x-0 bottom-0 z-[60] border-t border-[#FFD700] bg-black/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-16px_42px_rgba(0,0,0,.45)] backdrop-blur-xl">
      <div className="container flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="max-w-4xl text-sm leading-6 text-white/85">Utilizamos cookies para melhorar sua experiência em nosso site e plataforma. Ao continuar navegando, você concorda com nossa <a href="/privacidade" className="font-bold text-[#facb2e] underline decoration-[#facb2e]/55 underline-offset-4 hover:text-[#ffe063]">Política de Privacidade</a>.</p>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <button type="button" onClick={() => saveCookiePreference("declined")} className="cap-outline inline-flex min-h-11 items-center justify-center rounded-full border-white/20 px-6 py-2.5 text-sm font-bold text-white/75 hover:border-white/45 hover:text-white">Recusar</button>
          <button type="button" onClick={() => saveCookiePreference("accepted")} className="cap-cta inline-flex min-h-11 items-center justify-center rounded-full px-7 py-2.5 text-sm font-extrabold">Aceitar</button>
        </div>
      </div>
    </section>
  );
}
