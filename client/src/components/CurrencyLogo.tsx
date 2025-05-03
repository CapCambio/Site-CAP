import { currencyFlags } from "../lib/currency";

interface CurrencyLogoProps {
  code: string;
  className?: string;
}

export function CurrencyLogo({ code, className = "" }: CurrencyLogoProps) {
  const countryCode = currencyFlags[code] || "unknown";
  
  return (
    <img 
      src={`https://flagcdn.com/w40/${countryCode}.png`} 
      alt={`Bandeira - ${code}`} 
      className={`w-8 h-6 ${className}`} 
    />
  );
}
