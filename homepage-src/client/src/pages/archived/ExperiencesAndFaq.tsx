import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, MessageCircle, Quote } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * Arquivo de preservação das seções "Experiências reais" e "FAQ".
 * Os componentes podem ser restaurados individualmente em Home.tsx.
 */

type ArchivedExperiencesProps = {
  onContactClick: () => void;
};

type ArchivedFaqProps = {
  whatsappUrl: string;
};

export function ArchivedExperiences({ onContactClick }: ArchivedExperiencesProps) {
  const { t } = useTranslation();

  return (
    <section id="depoimentos" className="border-y border-white/10 bg-[#0a0a09] py-20 sm:py-28">
      <div className="container grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          <p className="cap-kicker text-[#facb2e]">{t('home.experiences.kicker')}</p>
          <h2 className="cap-display mt-3 text-4xl font-extrabold sm:text-5xl">{t('home.experiences.title')}</h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/60">{t('home.experiences.subtitle')}</p>
        </div>
        <div className="cap-surface flex min-h-[270px] flex-col justify-between rounded-[1.5rem] p-7 sm:p-9">
          <Quote className="size-10 text-[#facb2e]" />
          <div>
            <p className="cap-display max-w-lg text-2xl font-bold leading-tight">{t('home.experiences.quote')}</p>
            <p className="mt-4 text-sm leading-6 text-white/50">{t('home.experiences.quoteDesc')}</p>
          </div>
          <button onClick={onContactClick} className="mt-7 inline-flex w-fit items-center gap-2 text-sm font-bold text-[#facb2e]">{t('home.experiences.contactTeam')} <ArrowRight className="size-4" /></button>
        </div>
      </div>
    </section>
  );
}

export function ArchivedFaq({ whatsappUrl }: ArchivedFaqProps) {
  const { t } = useTranslation();

  const faqs = [
    {
      q: t('home.faq.q1'),
      a: (
        <>
          <p>{t('home.faq.a1p1')}</p>
          <p className="mt-4">{t('home.faq.a1p2')}</p>
          <p className="mt-4">{t('home.faq.a1p3')}</p>
        </>
      )
    },
    {
      q: t('home.faq.q2'),
      a: (
        <>
          <p>{t('home.faq.a2p1')}</p>
          <p className="mt-4">{t('home.faq.a2p2')}</p>
        </>
      )
    },
    {
      q: t('home.faq.q3'),
      a: <p>{t('home.faq.a3')}</p>
    },
    {
      q: t('home.faq.q4'),
      a: <p>{t('home.faq.a4')}</p>
    },
    {
      q: t('home.faq.q5'),
      a: (
        <>
          <p>{t('home.faq.a5p1')}</p>
          <p className="mt-4">{t('home.faq.a5p2')}</p>
          <p className="mt-4">{t('home.faq.a5p3')}</p>
        </>
      )
    },
    {
      q: t('home.faq.q6'),
      a: (
        <>
          <p>{t('home.faq.a6intro')}</p>
          <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
            {(t('home.faq.currencies', { returnObjects: true }) as string[]).map((currency: string) => (
              <li key={currency} className="flex items-center gap-2">
                <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-[#facb2e]" />
                {currency}
              </li>
            ))}
          </ul>
        </>
      )
    }
  ];

  return (
    <section id="faq" className="scroll-mt-24 py-20 max-sm:py-10 sm:py-20 lg:py-5">
      <div className="container grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="cap-kicker text-[#facb2e]">{t('home.faq.kicker')}</p>
          <h2 className="cap-display mt-3 text-4xl font-extrabold sm:text-5xl">{t('home.faq.title')}</h2>
          <p className="mt-6 max-w-md text-base leading-7 text-white/75">{t('home.faq.subtitle')}</p>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="cap-outline mt-7 inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold">{t('home.faq.cta')} <MessageCircle className="size-4 text-[#facb2e]" /></a>
        </div>
        <Accordion type="single" collapsible className="rounded-2xl border border-white/10 bg-white/[.02] px-5 sm:px-7">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`faq-${index}`}>
              <AccordionTrigger className="py-6 text-base font-bold text-white hover:no-underline">{faq.q}</AccordionTrigger>
              <AccordionContent className="max-w-2xl pb-6 text-sm leading-6 text-white/72">{faq.a}</AccordionContent>
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
