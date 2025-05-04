import { useState, useEffect } from "react";
import { Currency } from "@/lib/types";
import { formatCurrencyValue } from "@/lib/currency";
import { CurrencyLogo } from "./CurrencyLogo";
import { ArrowUpDown } from "lucide-react";

interface CurrencyConverterProps {
  currencies: Currency[];
}

export function CurrencyConverter({ currencies }: CurrencyConverterProps) {
  const [fromCurrency, setFromCurrency] = useState<string>("BRL");
  const [toCurrency, setToCurrency] = useState<string>("USD");
  const [amount, setAmount] = useState<string>("1000");
  const [convertedAmount, setConvertedAmount] = useState<string>("");
  const [showFromDropdown, setShowFromDropdown] = useState<boolean>(false);
  const [showToDropdown, setShowToDropdown] = useState<boolean>(false);

  // Adicionar Real à lista de moedas disponíveis se não estiver na lista
  const allCurrencies = [
    ...currencies,
    { 
      code: "BRL", 
      name: "Real Brasileiro",
      buyPrice: 1,
      sellPrice: 1
    }
  ];

  useEffect(() => {
    // Fechar dropdowns quando clicar fora deles
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.currency-dropdown')) {
        setShowFromDropdown(false);
        setShowToDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    convertCurrency();
  }, [fromCurrency, toCurrency, amount, currencies]);

  const convertCurrency = () => {
    if (!amount || isNaN(Number(amount))) {
      setConvertedAmount("");
      return;
    }

    let result: number;

    // Restrict conversion between two foreign currencies
    if (fromCurrency !== "BRL" && toCurrency !== "BRL") {
      setConvertedAmount("Invalid conversion");
      return;
    }


    // Se o valor convertido for de BRL para moeda estrangeira
    if (fromCurrency === "BRL") {
      const targetCurrency = currencies.find(c => c.code === toCurrency);
      if (!targetCurrency) return;

      result = Number(amount) / targetCurrency.sellPrice;
    } 
    // Se o valor convertido for de moeda estrangeira para BRL
    else if (toCurrency === "BRL") {
      const sourceCurrency = currencies.find(c => c.code === fromCurrency);
      if (!sourceCurrency) return;

      result = Number(amount) * sourceCurrency.buyPrice;
    }

    // Formatar o resultado com até 5 casas decimais, removendo zeros à direita
    let stringValue = result.toFixed(5);
    stringValue = stringValue.replace(/\.?0+$/, "");
    if (stringValue.endsWith('.')) {
      stringValue = stringValue.slice(0, -1);
    }

    setConvertedAmount(stringValue);
  };

  const handleFromCurrencyChange = (code: string) => {
    setFromCurrency(code);
    setShowFromDropdown(false);
  };

  const handleToCurrencyChange = (code: string) => {
    setToCurrency(code);
    setShowToDropdown(false);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir apenas números e ponto decimal no campo de entrada
    const value = e.target.value.replace(/[^\d.]/g, '');
    setAmount(value);
  };

  // Trocar as moedas de lugar
  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="relative max-w-xl mx-auto my-6">
      <div className="bg-[#252525] p-4 sm:p-6 rounded-xl overflow-hidden">
        {/* Campo de entrada com moeda "FROM" */}
        <div className="bg-white rounded-xl flex justify-between items-center p-4 mb-4 relative"> {/* Changed background to white */}
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            className="text-2xl sm:text-3xl font-medium bg-transparent border-none focus:ring-0 focus:outline-none text-black w-3/5"
            placeholder="0"
          />

          <div className="currency-dropdown relative">
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => setShowFromDropdown(!showFromDropdown)}
            >
              <span className="text-2xl sm:text-3xl font-bold mr-1">{fromCurrency}</span>
              <CurrencyLogo code={fromCurrency} className="w-5 h-5 mr-2"/> {/* Added flag */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {showFromDropdown && (
              <div className="absolute right-0 top-full mt-1 w-56 max-h-60 overflow-y-auto z-10 bg-white rounded-md shadow-lg">
                {allCurrencies.map((currency) => (
                  <div 
                    key={`from-${currency.code}`}
                    className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleFromCurrencyChange(currency.code)}
                  >
                    <CurrencyLogo code={currency.code} className="w-5 h-5 mr-2" />
                    <span className="font-medium">{currency.code}</span>
                    <span className="text-xs ml-2 text-gray-500 truncate">{currency.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botão para trocar as moedas */}
        <div className="flex justify-center -my-3 z-10 relative">
          <button
            onClick={handleSwapCurrencies}
            className="bg-black rounded-full p-2 text-white"
          >
            <ArrowUpDown size={24} />
          </button>
        </div>

        {/* Campo de saída com moeda "TO" */}
        <div className="bg-white rounded-xl flex justify-between items-center p-4 mt-3 relative"> {/* Changed background to white */}
          <div className="text-2xl sm:text-3xl font-medium text-black w-3/5 truncate">
            {convertedAmount || "0"}
          </div>

          <div className="currency-dropdown relative">
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => setShowToDropdown(!showToDropdown)}
            >
              <span className="text-2xl sm:text-3xl font-bold mr-1">{toCurrency}</span>
              <CurrencyLogo code={toCurrency} className="w-5 h-5 mr-2"/> {/* Added flag */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {showToDropdown && (
              <div className="absolute right-0 top-full mt-1 w-56 max-h-60 overflow-y-auto z-10 bg-white rounded-md shadow-lg">
                {allCurrencies.map((currency) => (
                  <div 
                    key={`to-${currency.code}`}
                    className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleToCurrencyChange(currency.code)}
                  >
                    <CurrencyLogo code={currency.code} className="w-5 h-5 mr-2" />
                    <span className="font-medium">{currency.code}</span>
                    <span className="text-xs ml-2 text-gray-500 truncate">{currency.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}