import { useEffect, useState } from "react";

const WHATSAPP_PATH =
  "M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z";

const DEFAULT_MESSAGE = encodeURIComponent("Olá! Vim pelo site da CAP e gostaria de mais informações.");

const options = [
  { id: "caxias", label: "Caxias do Sul - RS", phone: "5554984348005" },
  { id: "bento", label: "Bento Gonçalves - RS", phone: "5554999578486" },
  { id: "passo", label: "Passo Fundo - RS", phone: "5554996280422" },
];

const waLink = (phone: string, message: string = DEFAULT_MESSAGE) => `https://api.whatsapp.com/send?phone=${phone}&text=${message}`;

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 448 512" fill="currentColor" className={className}>
      <path d={WHATSAPP_PATH} />
    </svg>
  );
}

export default function WhatsAppFloat() {
  const [open, setOpen] = useState(false);
  const [hideCaxias, setHideCaxias] = useState(false);
  const [customMessage, setCustomMessage] = useState<string | null>(null);

  useEffect(() => {
    const onOpenEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ hideCaxias?: boolean; message?: string }>).detail;
      setHideCaxias(Boolean(detail?.hideCaxias));
      setCustomMessage(detail?.message ? encodeURIComponent(detail.message) : null);
      setOpen(true);
    };

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const link = target.closest("a[href]");
      if (link && !link.closest("[data-cap-whatsapp-option]") && !link.hasAttribute("data-cap-whatsapp-direct") && /whatsapp\.com|wa\.me/i.test(link.getAttribute("href") || "")) {
        event.preventDefault();
        event.stopPropagation();
        setHideCaxias(false);
        setCustomMessage(null);
        setOpen(true);
      }
    };

    window.addEventListener("cap:open-whatsapp", onOpenEvent);
    document.addEventListener("click", onDocumentClick, true);
    return () => {
      window.removeEventListener("cap:open-whatsapp", onOpenEvent);
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Contato via WhatsApp"
        aria-controls="cap-whatsapp-dialog"
        onClick={() => {
          setHideCaxias(false);
          setCustomMessage(null);
          setOpen(true);
        }}
        className="fixed bottom-20 right-6 z-50 flex size-12 items-center justify-center rounded-full border-0 bg-[#22c55e] text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,.25)] transition-[transform,background] duration-200 hover:scale-110 hover:bg-[#16a34a] focus:outline-2 focus:outline-offset-2 focus:outline-[#4ade80] md:bottom-12"
      >
        <span aria-hidden="true" className="cap-whatsapp-ring pointer-events-none absolute inset-0 rounded-full border-2 border-[#25d366]" />
        <WhatsAppGlyph className="block h-[26px] w-[26px]" />
      </button>

      {open && (
        <div
          id="cap-whatsapp-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cap-whatsapp-title"
          onClick={event => {
            if (event.target === event.currentTarget) { setOpen(false); setCustomMessage(null); }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        >
          <div className="relative grid w-[min(100%-32px,512px)] gap-4 rounded-lg border border-[#eab308]/20 bg-[#18181b] p-6 text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,.3)]">
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => { setOpen(false); setCustomMessage(null); }}
              className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-md border-0 bg-transparent p-1 text-[#eab308] opacity-70 transition-opacity hover:opacity-100"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
            <h2 id="cap-whatsapp-title" className="m-0 text-left text-lg font-semibold">
              Com qual CAP deseja falar?
            </h2>
            <div className="mt-2 flex flex-col gap-3">
              {options
                .filter(option => !(hideCaxias && option.id === "caxias"))
                .map(option => (
                  <a
                    key={option.id}
                    data-cap-whatsapp-option
                    href={waLink(option.phone, customMessage ?? undefined)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-start gap-2 rounded-md bg-[#27272a] p-3 text-left text-base text-[#eab308] no-underline transition-colors hover:bg-[#3f3f46]"
                  >
                    <WhatsAppGlyph className="h-5 w-5 shrink-0 text-[#22c55e]" />
                    <span className="flex-1">{option.label}</span>
                  </a>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
