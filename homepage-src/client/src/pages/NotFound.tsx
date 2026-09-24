import { ArrowLeft, MapPin } from "lucide-react";
import { useLocation } from "wouter";

const capLogoUrl = `${import.meta.env.BASE_URL}assets/cap-logo.png`;

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,rgba(250,203,46,.13),transparent_24rem)]" />
      <section className="relative z-10 w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/[.025] p-7 text-center shadow-[0_28px_80px_rgba(0,0,0,.45)] backdrop-blur-sm sm:p-10">
        <img src={capLogoUrl} alt="CAP Câmbio" className="mx-auto h-16 w-auto object-contain" />
        <p className="cap-kicker mt-10 text-[#facb2e]">Página não encontrada</p>
        <h1 className="cap-display mt-3 text-6xl font-extrabold leading-none sm:text-7xl">404</h1>
        <h2 className="cap-display mt-5 text-2xl font-extrabold sm:text-3xl">Este destino não está disponível.</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/58 sm:text-base">O endereço pode ter sido atualizado ou não existe. Volte para a página inicial e encontre o caminho certo para a sua operação.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={() => setLocation("/")} className="cap-cta inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold"><ArrowLeft className="size-4" />Voltar para o início</button>
          <button onClick={() => setLocation("/#contato")} className="cap-outline inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold"><MapPin className="size-4 text-[#facb2e]" />Falar com a CAP</button>
        </div>
      </section>
    </main>
  );
}
