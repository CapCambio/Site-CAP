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
    // Se selecionar uma moeda estrangeira, força BRL como destino
    if (code !== "BRL") {
      setToCurrency("BRL");
    }
  };

  const handleToCurrencyChange = (code: string) => {
    // Só permite mudar se a moeda de origem for BRL
    if (fromCurrency === "BRL") {
      setToCurrency(code);
      setShowToDropdown(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir apenas números e ponto decimal no campo de entrada
    const value = e.target.value.replace(/[^\d.]/g, '');
    setAmount(value);
  };

  // Trocar as moedas de lugar apenas se uma delas for BRL
  const handleSwapCurrencies = () => {
    if (fromCurrency === "BRL" || toCurrency === "BRL") {
      setFromCurrency(toCurrency);
      setToCurrency(fromCurrency);
    }
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
              <div className="absolute right-0 top-full mt-1 w-72 max-h-96 overflow-y-auto z-10 bg-white rounded-md shadow-lg">
                {allCurrencies.map((currency) => (
                  <div 
                    key={`from-${currency.code}`}
                    className="flex items-center p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                    onClick={() => handleFromCurrencyChange(currency.code)}
                  >
                    <CurrencyLogo code={currency.code} className="w-6 h-6 mr-3" />
                    <div className="flex flex-col">
                      <span className="font-medium text-base">{currency.code}</span>
                      <span className="text-sm text-gray-600">{currency.name}</span>
                    </div>
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
            className="bg-black rounded-full p-1.5 text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 6L3 6L3 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 18H21V12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 6L21 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
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
              <div className="absolute right-0 top-full mt-1 w-72 max-h-96 overflow-y-auto z-10 bg-white rounded-md shadow-lg">
                {allCurrencies.map((currency) => (
                  <div 
                    key={`to-${currency.code}`}
                    className="flex items-center p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                    onClick={() => handleToCurrencyChange(currency.code)}
                  >
                    <CurrencyLogo code={currency.code} className="w-6 h-6 mr-3" />
                    <div className="flex flex-col">
                      <span className="font-medium text-base">{currency.code}</span>
                      <span className="text-sm text-gray-600">{currency.name}</span>
                    </div>
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