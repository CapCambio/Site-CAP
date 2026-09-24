import { ArrowLeft } from "lucide-react";

export default function ContactHeaderPreview() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0b0a] text-foreground">
      <div aria-hidden="true" className="cap-grid absolute inset-0 opacity-30" />
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(250,203,46,.12),transparent_28%),linear-gradient(180deg,rgba(0,0,0,.12),#0b0b0a_82%)]" />

      <a
        href="/"
        className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-sm font-semibold text-white/75 backdrop-blur-sm transition hover:border-[#facb2e]/70 hover:text-[#facb2e]"
      >
        <ArrowLeft className="size-4" />
        Voltar ao site
      </a>

      <main className="relative z-10 flex min-h-screen items-center px-5 py-24 sm:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <span className="inline-flex w-fit items-center justify-center rounded-full border border-border bg-accent px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
            Fale com a CAP
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            Entre em <span className="font-serif text-primary italic font-normal">contato</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Solicite sua cotação ou tire dúvidas com nossos especialistas.
          </p>
        </div>
      </main>
    </div>
  );
}
