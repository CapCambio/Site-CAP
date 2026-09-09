import { useEffect, useState, type CSSProperties } from "react";
import "./TvCaxiasPage.css";

const ASSET_BASE = import.meta.env.BASE_URL || '/';

/**
 * STYLE NOTE — Painel Passivo de Cotações:
 * a tabela permanece limpa e estritamente informativa; a barra amarela
 * combina o estado de atualização, uma janela editorial de viagens, CAP e ticker;
 * os elementos Halloween e Natal ocupam apenas os respiros da lateral e da margem da tabela,
 * sem deslocar itens oficiais. No Natal, guirlanda, luzes coloridas, sinos laterais e um fio vertical realista de enfeites
 * ocupam apenas os respiros acima do status e antes das bandeiras.
 */

type Rate = {
  id: string;
  flagUrl: string;
  currency: string;
  buy: string;
  sell: string;
};

type GoogleSheetsResponse = {
  table?: {
    rows?: Array<{
      c?: Array<{ v?: string | null } | null>;
    }>;
  };
};

/**
 * Valores locais de contingência. A planilha pública atualiza as 16 moedas
 * disponíveis; itens ausentes, como o Dirham, permanecem com este valor.
 */
const RATES: Rate[] = [
  { id: "usd", flagUrl: `${ASSET_BASE}assets/us_b1b2a6e3.png`, currency: "Dólar Americano", buy: "5,0500", sell: "5,5700" },
  { id: "eur", flagUrl: `${ASSET_BASE}assets/eu_9ea20765.png`, currency: "Euro", buy: "5,9000", sell: "6,4800" },
  { id: "gbp", flagUrl: `${ASSET_BASE}assets/gb_290d0f48.png`, currency: "Libra Esterlina", buy: "6,9000", sell: "7,7400" },
  { id: "aud", flagUrl: `${ASSET_BASE}assets/au_058d7b28.png`, currency: "Dólar Australiano", buy: "3,6000", sell: "4,0900" },
  { id: "ars", flagUrl: `${ASSET_BASE}assets/ar_b1abffe2.png`, currency: "Peso Argentino", buy: "0,0035", sell: "0,0056" },
  { id: "nzd", flagUrl: `${ASSET_BASE}assets/nz_6e8f9064.png`, currency: "Dólar Neozelandês", buy: "2,8000", sell: "3,3400" },
  { id: "cad", flagUrl: `${ASSET_BASE}assets/ca_d70af462.png`, currency: "Dólar Canadense", buy: "3,6500", sell: "4,1400" },
  { id: "chf", flagUrl: `${ASSET_BASE}assets/ch_13a5032b.png`, currency: "Franco Suíço", buy: "6,2200", sell: "7,0300" },
  { id: "uyu", flagUrl: `${ASSET_BASE}assets/uy_adcd611e.png`, currency: "Peso Uruguaio", buy: "0,1200", sell: "0,1660" },
  { id: "clp", flagUrl: `${ASSET_BASE}assets/cl_05769a83.png`, currency: "Peso Chileno", buy: "0,0045", sell: "0,0069" },
  { id: "mxn", flagUrl: `${ASSET_BASE}assets/mx_3ab0dcc8.png`, currency: "Peso Mexicano", buy: "0,2800", sell: "0,3900" },
  { id: "cop", flagUrl: `${ASSET_BASE}assets/co_b59ac1cf.png`, currency: "Peso Colombiano", buy: "0,00135", sell: "0,0022" },
  { id: "cny", flagUrl: `${ASSET_BASE}assets/cn_7e22b1c1.png`, currency: "Iuan Chinês", buy: "0,7000", sell: "0,9100" },
  { id: "jpy", flagUrl: `${ASSET_BASE}assets/jp_931e9425.png`, currency: "Iene Japonês", buy: "0,0300", sell: "0,0375" },
  { id: "pen", flagUrl: `${ASSET_BASE}assets/pe_a2792b99.png`, currency: "Novo Sol Peruano", buy: "1,4500", sell: "1,8000" },
  { id: "zar", flagUrl: `${ASSET_BASE}assets/za_0f5e408d.png`, currency: "Rand Africano", buy: "0,2800", sell: "0,3920" },
  { id: "aed", flagUrl: `${ASSET_BASE}assets/ae_c9f358b9.png`, currency: "Dirham dos Emirados Árabes", buy: "1,2500", sell: "1,6700" },
];

const SHEET_ENDPOINT = "https://docs.google.com/spreadsheets/d/1FUFonvyBaF5kIpbKuAB53n_FEMZ1QDo1piI9JpsVsUk/gviz/tq?tqx=out:json&gid=0";

const HALLOWEEN_MONTH_INDEX = 9;
const CHRISTMAS_MONTH_INDEX = 11;
// Temas finalizados: ativação automática somente pelos respectivos meses.

const HALLOWEEN_ASSETS = {
  cornerWeb: `${ASSET_BASE}assets/cap-halloween-corner-web-clean_0585394f.png`,
  connectorWeb: `${ASSET_BASE}assets/cap-halloween-long-horizontal-web_de52f75c.png`,
  batLeft: `${ASSET_BASE}assets/cap-halloween-bat-glide-left_58ed4c2b.png`,
  batCenter: `${ASSET_BASE}assets/cap-halloween-bat-wings-wide_54b48ef0.png`,
  batRight: `${ASSET_BASE}assets/cap-halloween-bat-dive-right_358dda51.png`,
  witchHat: `${ASSET_BASE}assets/cap-witch-hat-refined_539e693f.png`,
  peekingCat: `${ASSET_BASE}assets/cap-halloween-peeking-cat-yellow-eyes_01093d9a.png`,
  tableSpider: `${ASSET_BASE}assets/cap-halloween-table-spider_241dbb43.png`,
  pumpkin: `${ASSET_BASE}assets/cap-halloween-ticker-pumpkin_4e4625df.png`,
  ghost: `${ASSET_BASE}assets/cap-halloween-ghost-clean_8f7597c2.png`,
} as const;

const CHRISTMAS_ASSETS = {
  titleGarlandStraight: `${ASSET_BASE}assets/cap-christmas-title-garland_9710d700.png`,
  titleGarlandArched: `${ASSET_BASE}assets/cap-christmas-title-garland-arched_3825cb80.png`,
  titleGarlandArchedClean: `${ASSET_BASE}assets/cap-christmas-title-garland-arched-clean_e5a58cc9.png`,
  titleGarlandInvertedArch: `${ASSET_BASE}assets/cap-christmas-title-garland-inverted-arch_285e4d08.png`,
  titleBellLeft: `${ASSET_BASE}assets/cap-christmas-title-bell-left_8b454d7f.png`,
  titleBellRight: `${ASSET_BASE}assets/cap-christmas-title-bell-right_54265210.png`,
  santaHat: `${ASSET_BASE}assets/cap-christmas-santa-hat_c2d01403.png`,
  capReindeerFullBody: `${ASSET_BASE}assets/cap-christmas-reindeer-full-body-c-overlay_bcb088ac.png`,
  capReindeerBust: `${ASSET_BASE}assets/cap-christmas-reindeer-c-overlay_94d59979.png`,
  tickerTree: `${ASSET_BASE}assets/cap-ticker-christmas-tree_f82241d9.png`,
  tickerGifts: `${ASSET_BASE}assets/cap-ticker-christmas-gifts_0d258e5d.png`,
  tableBaubleRed: `${ASSET_BASE}assets/cap-christmas-table-bauble-red_fbe9340f.png`,
  tableBaubleGold: `${ASSET_BASE}assets/cap-christmas-table-bauble-gold_7b07ccd3.png`,
  tableBaubleGreen: `${ASSET_BASE}assets/cap-christmas-table-bauble-green_69c5b6d9.png`,
  tableRealisticGarland: `${ASSET_BASE}assets/cap-christmas-table-realistic-garland-reference_df008eb2.png`,
  tableReferenceGarland: `${ASSET_BASE}assets/preview_natal_-_Copia-removebg-preview_271b8ee1.png`,
} as const;

const ORIGINAL_BRAND_ASSETS = {
  capLogo: `${ASSET_BASE}assets/cap-logo-original_705cfd0e.png`,
} as const;

const TRAVEL_SLIDES = [
  {
    src: `${ASSET_BASE}assets/Cambio1.jpg`,
    alt: "CAP Câmbio — principais moedas do mundo",
  },
  {
    src: `${ASSET_BASE}assets/Remessa1.jpg`,
    alt: "Envio de dinheiro ao exterior via Remessa Expressa",
  },
  {
    src: `${ASSET_BASE}assets/DHL1.jpg`,
    alt: "Envios internacionais via DHL",
  },
  {
    src: `${ASSET_BASE}assets/Cambio2.jpg`,
    alt: "CAP Câmbio — compra e venda de moedas estrangeiras",
  },
  {
    src: `${ASSET_BASE}assets/Remessa2.jpg`,
    alt: "Receba sua remessa via MoneyGram",
  },
  {
    src: `${ASSET_BASE}assets/DHL2.jpg`,
    alt: "Envie documentos e encomendas via DHL",
  },
];

function tickerRate(value: string) {
  return Number(value.replace(",", ".")).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function TickerContent({ dollar, euro, halloweenActive, christmasActive }: { dollar: Rate; euro: Rate; halloweenActive: boolean; christmasActive: boolean }) {
  return (
    <>
      <span className="side-ticker__copy">DÓLAR AMERICANO: COMPRA R$ {tickerRate(dollar.buy)}</span>
      {halloweenActive ? <img className="side-ticker__pumpkin" src={HALLOWEEN_ASSETS.pumpkin} alt="" /> : christmasActive ? <img className="side-ticker__christmas-tree" src={CHRISTMAS_ASSETS.tickerTree} alt="" /> : <span className="side-ticker__separator side-ticker__separator--rate" aria-hidden="true">•</span>}
      <span className="side-ticker__copy">VENDA R$ {tickerRate(dollar.sell)}</span>
      {halloweenActive ? <img className="side-ticker__ghost" src={HALLOWEEN_ASSETS.ghost} alt="" /> : christmasActive ? <img className="side-ticker__christmas-gifts" src={CHRISTMAS_ASSETS.tickerGifts} alt="" /> : <span className="side-ticker__separator side-ticker__separator--currency" aria-hidden="true">•</span>}
      <span className="side-ticker__copy">EURO: COMPRA R$ {tickerRate(euro.buy)}</span>
      {halloweenActive ? <img className="side-ticker__pumpkin" src={HALLOWEEN_ASSETS.pumpkin} alt="" /> : christmasActive ? <img className="side-ticker__christmas-tree" src={CHRISTMAS_ASSETS.tickerTree} alt="" /> : <span className="side-ticker__separator side-ticker__separator--rate" aria-hidden="true">•</span>}
      <span className="side-ticker__copy">VENDA R$ {tickerRate(euro.sell)}</span>
      {halloweenActive ? <img className="side-ticker__ghost" src={HALLOWEEN_ASSETS.ghost} alt="" /> : christmasActive ? <img className="side-ticker__christmas-gifts" src={CHRISTMAS_ASSETS.tickerGifts} alt="" /> : <span className="side-ticker__separator side-ticker__separator--currency" aria-hidden="true">•</span>}
    </>
  );
}

function HalloweenTopDecor() {
  return (
    <div className="halloween-top-decor" aria-hidden="true">
      <img className="halloween-corner-web halloween-corner-web--left" src={HALLOWEEN_ASSETS.cornerWeb} alt="" />
      <img className="halloween-corner-web halloween-corner-web--right" src={HALLOWEEN_ASSETS.cornerWeb} alt="" />
      <img className="halloween-web-connector" src={HALLOWEEN_ASSETS.connectorWeb} alt="" />
      <img className="halloween-bat halloween-bat--one" src={HALLOWEEN_ASSETS.batLeft} alt="" />
      <img className="halloween-bat halloween-bat--two" src={HALLOWEEN_ASSETS.batCenter} alt="" />
      <img className="halloween-bat halloween-bat--three" src={HALLOWEEN_ASSETS.batRight} alt="" />
    </div>
  );
}

function normalizeCurrencyName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function normalizeRateValue(value: string) {
  const withoutCurrency = value.replace(/r\$|\s/gi, "").trim();

  // Se houver múltiplos valores separados por "/", pega apenas o último
  if (withoutCurrency.includes("/")) {
    const parts = withoutCurrency.split("/");
    const lastValue = parts[parts.length - 1].trim();
    return lastValue.includes(",") ? lastValue : lastValue.replace(".", ",");
  }

  return withoutCurrency.includes(",") ? withoutCurrency : withoutCurrency.replace(".", ",");
}

/**
 * Formata somente a leitura da tabela. A string original é preservada, com ao
 * menos duas casas e sem zeros finais adicionais; nenhum valor é arredondado.
 */
function tableRate(value: string) {
  const normalized = normalizeRateValue(value);
  const [integerPart, decimalPart = ""] = normalized.split(",");
  const numericValue = Math.abs(Number(`${integerPart}.${decimalPart}`));

  if (!Number.isFinite(numericValue)) return normalized;

  const relevantDigits = decimalPart.replace(/0+$/, "").length;
  const minimumFractionDigits = 2;
  const fractionDigits = Math.max(relevantDigits, minimumFractionDigits);

  if (fractionDigits === 0) return integerPart;
  return `${integerPart},${decimalPart.slice(0, fractionDigits).padEnd(fractionDigits, "0")}`;
}

function ratesFromSheet(responseText: string): Rate[] {
  const start = responseText.indexOf("{");
  const end = responseText.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("Resposta da planilha em formato inesperado.");
  }

  const payload = JSON.parse(responseText.slice(start, end + 1)) as GoogleSheetsResponse;
  const sheetRows = payload.table?.rows?.slice(1) ?? [];
  const valuesByCurrency = new Map(
    sheetRows.flatMap((row) => {
      const [currency, buy, sell] = row.c ?? [];
      if (!currency?.v || !buy?.v || !sell?.v) return [];

      return [[normalizeCurrencyName(currency.v), {
        buy: normalizeRateValue(buy.v),
        sell: normalizeRateValue(sell.v),
      }] as const];
    }),
  );

  return RATES.map((rate) => {
    const sourceRate = valuesByCurrency.get(normalizeCurrencyName(rate.currency));
    return sourceRate ? { ...rate, ...sourceRate } : rate;
  });
}

export default function TvCaxiasPage() {
  const [rates, setRates] = useState(RATES);
  const [seasonalDate, setSeasonalDate] = useState(() => new Date());
  const dollar = rates.find((rate) => rate.id === "usd") ?? rates[0];
  const euro = rates.find((rate) => rate.id === "eur") ?? rates[1];
  const [activeTravelSlide, setActiveTravelSlide] = useState(0);
  const halloweenPreviewActive = seasonalDate.getMonth() === HALLOWEEN_MONTH_INDEX;
  const christmasActive = seasonalDate.getMonth() === CHRISTMAS_MONTH_INDEX;
  const originalLayoutActive = !halloweenPreviewActive && !christmasActive;
  const witchHatActive = halloweenPreviewActive;
  const halloweenTopDecorationActive = halloweenPreviewActive;

  useEffect(() => {
    let nextDayTimer: number | undefined;

    const scheduleNextDayCheck = () => {
      const now = new Date();
      const nextDay = new Date(now);
      nextDay.setHours(24, 0, 1, 0);

      nextDayTimer = window.setTimeout(() => {
        setSeasonalDate(new Date());
        scheduleNextDayCheck();
      }, nextDay.getTime() - now.getTime());
    };

    scheduleNextDayCheck();
    return () => {
      if (nextDayTimer) window.clearTimeout(nextDayTimer);
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadRates = async () => {
      try {
        const response = await fetch(`${SHEET_ENDPOINT}&cacheBust=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Não foi possível ler a planilha.");

        const updatedRates = ratesFromSheet(await response.text());
        if (isActive) setRates(updatedRates);
      } catch {
        // A TV mantém os valores locais caso a rede ou a planilha não estejam disponíveis.
      }
    };

    void loadRates();
    const refreshId = window.setInterval(loadRates, 60_000);

    return () => {
      isActive = false;
      window.clearInterval(refreshId);
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveTravelSlide((current) => (current + 1) % TRAVEL_SLIDES.length);
    }, 6500);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <main className={`broadcast-shell ${originalLayoutActive ? "broadcast-shell--original" : ""} ${halloweenPreviewActive ? "broadcast-shell--halloween-preview" : ""} ${christmasActive ? "broadcast-shell--christmas-preview" : ""}`}>
      <aside className="brand-rail" aria-label="Status das cotações">
        {halloweenTopDecorationActive && <HalloweenTopDecor />}
        {christmasActive && <img className="christmas-title-garland" src={CHRISTMAS_ASSETS.titleGarlandStraight} alt="" aria-hidden="true" />}
        {christmasActive && <span className="christmas-title-twinkle christmas-title-twinkle--one" aria-hidden="true" />}
        {christmasActive && <span className="christmas-title-twinkle christmas-title-twinkle--two" aria-hidden="true" />}
        {christmasActive && <span className="christmas-title-twinkle christmas-title-twinkle--three" aria-hidden="true" />}
        {christmasActive && <span className="christmas-title-twinkle christmas-title-twinkle--four" aria-hidden="true" />}
        {christmasActive && <img className="christmas-title-bell christmas-title-bell--left" src={CHRISTMAS_ASSETS.titleBellLeft} alt="" aria-hidden="true" />}
        {christmasActive && <img className="christmas-title-bell christmas-title-bell--right" src={CHRISTMAS_ASSETS.titleBellLeft} alt="" aria-hidden="true" />}
        {originalLayoutActive && <img className="brand-logo" src={ORIGINAL_BRAND_ASSETS.capLogo} alt="CAP Câmbio" />}
        <p className="brand-status"><span className="brand-status__first-line">Cotações</span><span>atualizadas</span></p>
        <div className="travel-carousel" aria-label="Destinos para viajar">
          {TRAVEL_SLIDES.map((slide, index) => (
            <img
              key={slide.src}
              className={`travel-carousel__slide ${index === activeTravelSlide ? "is-active" : ""}`}
              src={slide.src}
              alt={slide.alt}
              aria-hidden={index !== activeTravelSlide}
              loading={index === 0 ? "eager" : "lazy"}
            />
          ))}
        </div>
        {halloweenPreviewActive && <img className="halloween-cap-web" src={HALLOWEEN_ASSETS.cornerWeb} alt="" aria-hidden="true" />}
        {halloweenPreviewActive && <img className="halloween-cap-cat" src={HALLOWEEN_ASSETS.peekingCat} alt="" aria-hidden="true" />}
        <span className="cap-mark" aria-hidden="true">CAP</span>
        {witchHatActive && <img className="halloween-witch-hat" src={HALLOWEEN_ASSETS.witchHat} alt="" aria-hidden="true" />}
        {christmasActive && <img className="christmas-santa-hat" src={CHRISTMAS_ASSETS.santaHat} alt="" aria-hidden="true" />}
        {christmasActive && <img className="christmas-cap-reindeer christmas-cap-reindeer--full-body" src={CHRISTMAS_ASSETS.capReindeerFullBody} alt="" aria-hidden="true" />}
          <div className="side-ticker" aria-label="Informações em movimento">
            <div className="side-ticker__track">
              <span className="side-ticker__cycle"><TickerContent dollar={dollar} euro={euro} halloweenActive={halloweenPreviewActive} christmasActive={christmasActive} /></span>
              <span className="side-ticker__cycle" aria-hidden="true"><TickerContent dollar={dollar} euro={euro} halloweenActive={halloweenPreviewActive} christmasActive={christmasActive} /></span>
            </div>
        </div>
      </aside>

      <section className="quote-stage quote-stage--table-only" aria-label="Tabela de cotações">
        <div className="quote-table-wrap">
          <table className="quote-table">
            <thead>
              <tr>
                <th scope="col" className="currency-head">
                  <span>MOEDA</span>
                </th>
                <th scope="col"><span>COMPRA</span></th>
                <th scope="col"><span>VENDA</span></th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate, index) => (
                <tr key={rate.id} style={{ "--row-index": index } as CSSProperties}>
                  <th scope="row" className="currency-cell">
                    <img className="flag-image" src={rate.flagUrl} alt="" aria-hidden="true" />
                    <span>{rate.currency}</span>
                  </th>
                  <td><span className="rate-value">R$ {tableRate(rate.buy)}</span></td>
                  <td><span className="rate-value">R$ {tableRate(rate.sell)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {christmasActive && (
            <span className="christmas-table-ornament" aria-hidden="true">
              <img className="christmas-table-ornament__image" src={CHRISTMAS_ASSETS.tableReferenceGarland} alt="" />
            </span>
          )}
          {halloweenPreviewActive && <span className="halloween-table-spider-thread" aria-hidden="true" />}
          {halloweenPreviewActive && <img className="halloween-table-spider" src={HALLOWEEN_ASSETS.tableSpider} alt="" aria-hidden="true" />}
        </div>
      </section>
    </main>
  );
}
