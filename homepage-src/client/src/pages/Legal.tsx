import { ArrowLeft, BadgeCheck, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

type LegalKind = "privacy" | "terms";
const capLogoUrl = `${import.meta.env.BASE_URL}assets/cap-logo.png`;

export default function Legal({ kind }: { kind: LegalKind }) {
  const { t } = useTranslation();
  const prefix = kind === "privacy" ? "legal.privacy" : "legal.terms";

  const sectionKeys = kind === "privacy"
    ? [["s1t", "s1x"], ["s2t", "s2x"], ["s3t", "s3x"], ["s4t", "s4x"], ["s5t", "s5x"]]
    : [["s1t", "s1x"], ["s2t", "s2x"], ["s3t", "s3x"], ["s4t", "s4x"]];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="cap-grid fixed inset-0 -z-10 opacity-35 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="container max-w-4xl py-8 sm:py-14">
        <Link href="/" className="cap-outline inline-flex h-12 items-center gap-2 rounded-full px-3 text-sm font-bold"><img src={capLogoUrl} alt="CAP Câmbio" className="h-8 w-auto object-contain" /><ArrowLeft className="size-4" />{t("legal.back")}</Link>
        <div className="mt-14 max-w-3xl">
          <p className="cap-kicker text-[#facb2e]">{t(`${prefix}.kicker`)}</p>
          <h1 className="cap-display mt-4 text-4xl font-extrabold leading-[1.02] sm:text-6xl">{t(`${prefix}.title`)}</h1>
          <p className="mt-7 text-base leading-7 text-white/64 sm:text-lg">{t(`${prefix}.intro`)}</p>
        </div>
        <div className="mt-12 grid gap-4">{sectionKeys.map(([tk, xk], index) => <section key={tk} className="cap-surface rounded-2xl p-6 sm:p-7"><div className="flex gap-4"><div className="mt-0.5 rounded-xl bg-[#facb2e] p-2 text-black">{index % 2 === 0 ? <ShieldCheck className="size-5" /> : <BadgeCheck className="size-5" />}</div><div><h2 className="cap-display text-xl font-extrabold">{t(`${prefix}.${tk}`)}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">{t(`${prefix}.${xk}`)}</p></div></div></section>)}</div>
        <p className="mt-10 border-t border-white/10 pt-6 text-xs leading-5 text-white/38">{t("legal.footer")}</p>
      </div>
    </main>
  );
}
