import { useState, useEffect } from "react";
import { Currency } from "@/lib/types";
import { formatCurrencyValue } from "@/lib/currency";
import { CurrencyLogo } from "./CurrencyLogo";

interface CurrencyConverterProps {
  currencies: Currency[];
}

export function CurrencyConverter({ currencies }: CurrencyConverterProps) {
  const [fromCurrency, setFromCurrency] = useState<string>("BRL");
  const [toCurrency, setToCurrency] = useState<string>("USD");
  const [amount, setAmount] = useState<string>("1000");
  const [convertedAmount, setConvertedAmount] = useState<string>("");
  const [isApproximateValue, setIsApproximateValue] = useState<boolean>(false);
  const [showFromDropdown, setShowFromDropdown] = useState<boolean>(false);
  const [showToDropdown, setShowToDropdown] = useState<boolean>(false);

  const allCurrencies = [
    { 
      code: "BRL", 
      name: "Real Brasileiro",
      buyPrice: 1,
      sellPrice: 1
    },
    ...currencies
  ];

  useEffect(() => {
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

    let result = 0; 

    if (fromCurrency !== "BRL" && toCurrency !== "BRL") {
      setConvertedAmount("Invalid conversion");
      return;
    }

    if (fromCurrency === "BRL") {
      const targetCurrency = currencies.find(c => c.code === toCurrency);
      if (!targetCurrency) return;
      result = Number(amount) / targetCurrency.sellPrice;
    } else if (toCurrency === "BRL") {
      const sourceCurrency = currencies.find(c => c.code === fromCurrency);
      if (!sourceCurrency) return;
      result = Number(amount) * sourceCurrency.buyPrice;
    }

    // Formatar o valor com até 5 casas decimais, removendo zeros à direita
    let stringValue = result.toFixed(5);
    stringValue = stringValue.replace(/\.?0+$/, "");
    if (stringValue.endsWith('.')) {
      stringValue = stringValue.slice(0, -1);
    }

    // Se o destino é BRL, mostrar valor exato
    // Se não, arredondar para inteiro se não for inteiro
    if (toCurrency !== "BRL" && Math.floor(result) !== result) {
      setIsApproximateValue(true);
      setConvertedAmount(Math.round(result).toString());
    } else {
      setIsApproximateValue(false);
      setConvertedAmount(stringValue);
    }
  };

  const handleFromCurrencyChange = (code: string) => {
    setFromCurrency(code);
    setShowFromDropdown(false);
    if (code !== "BRL") {
      setToCurrency("BRL");
    }
  };

  const handleToCurrencyChange = (code: string) => {
    if (fromCurrency === "BRL") {
      setToCurrency(code);
      setShowToDropdown(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, '');
    setAmount(value);
  };

  const handleSwapCurrencies = () => {
    if (fromCurrency === "BRL" || toCurrency === "BRL") {
      setFromCurrency(toCurrency);
      setToCurrency(fromCurrency);
    }
  };

  return (
    <div className="relative max-w-3xl mx-auto mt-0 mb-6">
      <div className="bg-[#252525] p-3 pb-8 sm:p-6 sm:pb-12 rounded-xl overflow-hidden">
        <h2 className="text-white text-xl font-semibold mb-2 sm:mb-3 text-center">Conversor de Moedas</h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          {/* Campo de entrada com moeda "FROM" */}
          <div className="bg-[#f3b234] rounded-xl flex justify-between items-center p-3 mb-3 sm:mb-0 relative flex-1 h-14 sm:h-[4.5rem]">
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              className="text-xl sm:text-2xl font-medium bg-[#f3b234] border-none focus:ring-0 focus:outline-none text-black w-3/5"
              placeholder="0"
            />

            <div className="currency-dropdown relative">
              <div 
                className="flex items-center cursor-pointer" 
                onClick={() => {
                    setShowToDropdown(false);
                    setShowFromDropdown(!showFromDropdown);
                  }}
              >
                <span className="text-xl sm:text-2xl font-bold mr-1">{fromCurrency}</span>
                <CurrencyLogo code={fromCurrency} className="w-5 h-5 mr-2"/>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L12 15L18 9" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {showFromDropdown && !showToDropdown && (
                <div className="absolute mt-1 w-60 max-h-80 overflow-y-auto z-50 bg-white rounded-md shadow-lg" style={{top: '100%', left: '0'}}>
                  {allCurrencies.map((currency) => (
                    <div 
                      key={`from-${currency.code}`}
                      className="flex items-center p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                      onClick={() => handleFromCurrencyChange(currency.code)}
                    >
                      <CurrencyLogo code={currency.code} className="w-5 h-5 mr-2" />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{currency.code}</span>
                        <span className="text-xs text-gray-600">{currency.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Botão para trocar as moedas */}
          <div className="flex justify-center items-center z-10 relative sm:mx-4 sm:self-center sm:flex-shrink-0">
            <button
              onClick={handleSwapCurrencies}
              className="bg-black hover:bg-gray-800 transition-colors rounded-lg p-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 8L3 12L7 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 16L21 12L17 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 12H21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Campo de saída com moeda "TO" */}
          <div className="relative flex-1">
            <div className="bg-[#f3b234] rounded-xl flex justify-between items-center p-3 h-14 sm:h-[4.5rem] mt-3 sm:mt-0">
              <div className="text-xl sm:text-2xl font-medium text-black truncate w-3/5">
                {convertedAmount ? convertedAmount : "0"}
              </div>

              <div className="currency-dropdown relative">
                <div 
                  className={`flex items-center ${fromCurrency === "BRL" ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                  onClick={() => {
                    if (fromCurrency === "BRL") {
                      setShowFromDropdown(false);
                      setShowToDropdown(!showToDropdown);
                    }
                  }}
                >
                  <span className="text-xl sm:text-2xl font-bold mr-1">{toCurrency}</span>
                  <CurrencyLogo code={toCurrency} className="w-5 h-5 mr-2"/>
                  {fromCurrency === "BRL" && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 9L12 15L18 9" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>

                {showToDropdown && fromCurrency === "BRL" && (
                  <div className="absolute mt-1 w-60 max-h-80 overflow-y-auto z-50 bg-white rounded-md shadow-lg" style={{top: '100%', left: '0'}}>
                    {allCurrencies.filter(currency => currency.code !== fromCurrency).map((currency) => (
                      <div 
                        key={`to-${currency.code}`}
                        className="flex items-center p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                        onClick={() => handleToCurrencyChange(currency.code)}
                      >
                        <CurrencyLogo code={currency.code} className="w-5 h-5 mr-2" />
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{currency.code}</span>
                          <span className="text-xs text-gray-600">{currency.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {isApproximateValue && (
              <div className="text-center mt-1 absolute w-full">
                <span className="text-[#f3b234] text-xs">Valor aproximado</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}