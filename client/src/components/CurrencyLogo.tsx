import { currencyFlags } from "../lib/currency";

interface CurrencyLogoProps {
  code: string;
  className?: string;
}

export function CurrencyLogo({ code, className = "" }: CurrencyLogoProps) {
  // Real Brasileiro não está no mapa de moedas, pois não é estrangeiro
  // Tratar separadamente
  if (code === "BRL") {
    return (
      <img 
        src="https://flagcdn.com/w40/br.png" 
        alt="Bandeira - Brasil" 
        className={`w-8 h-6 ${className}`} 
      />
    );
  }
  
  const countryCode = currencyFlags[code] || "unknown";
  
  return (
    <img 
      src={`https://flagcdn.com/w40/${countryCode}.png`} 
      alt={`Bandeira - ${code}`} 
      className={`w-8 h-6 ${className}`} 
    />
  );
}
