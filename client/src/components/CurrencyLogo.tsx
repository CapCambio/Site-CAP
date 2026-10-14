import { currencyFlags } from "../lib/currency";

interface CurrencyLogoProps {
  code: string;
  className?: string;
}

// Map currency codes to local asset files
const currencyFlagAssets: Record<string, string> = {
  BRL: "/assets/br_flag.png",
  USD: "/assets/us_b1b2a6e3.png",
  EUR: "/assets/eu_9ea20765.png",
  GBP: "/assets/gb_290d0f48.png",
  CAD: "/assets/ca_d70af462.png",
  AUD: "/assets/au_058d7b28.png",
  JPY: "/assets/jp_931e9425.png",
  CHF: "/assets/ch_13a5032b.png",
  CNY: "/assets/cn_7e22b1c1.png",
  ARS: "/assets/ar_b1abffe2.png",
  UYU: "/assets/uy_adcd611e.png",
  PEN: "/assets/pe_a2792b99.png",
  CLP: "/assets/cl_05769a83.png",
  MXN: "/assets/mx_3ab0dcc8.png",
  COP: "/assets/co_b59ac1cf.png",
  NZD: "/assets/nz_6e8f9064.png",
  ZAR: "/assets/za_0f5e408d.png",
  AED: "/assets/ae_c9f358b9.png",
};

export function CurrencyLogo({ code, className = "" }: CurrencyLogoProps) {
  const flagSrc = currencyFlagAssets[code];
  
  if (!flagSrc) {
    // Fallback para country code via currencyFlags se não tiver asset local
    const countryCode = currencyFlags[code];
    if (countryCode) {
      return (
        <img 
          src={`https://flagcdn.com/w40/${countryCode}.png`} 
          alt={`Bandeira - ${code}`} 
          className={`w-8 h-6 ${className}`} 
        />
      );
    }
    return null;
  }
  
  return (
    <img 
      src={flagSrc} 
      alt={`Bandeira - ${code}`} 
      className={`w-8 h-6 ${className}`} 
    />
  );
}
