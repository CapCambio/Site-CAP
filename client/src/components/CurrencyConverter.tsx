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
  const [mode, setMode] = useState<"tenho" | "preciso">("tenho");

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
      if (showFromDropdown || showToDropdown) {
        const converterElement = document.querySelector(".currency-converter");
        if (converterElement && !converterElement.contains(event.target as Node)) {
          setShowFromDropdown(false);
          setShowToDropdown(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFromDropdown, showToDropdown]);

  // Aplicar regras apenas quando duas moedas estrangeiras são selecionadas
  useEffect(() => {
    if (fromCurrency !== "BRL" && toCurrency !== "BRL") {
      setFromCurrency("BRL");
    }
  }, [fromCurrency, toCurrency]);

  useEffect(() => {
    const fromCurrencyData = allCurrencies.find(c => c.code === fromCurrency);
    const toCurrencyData = allCurrencies.find(c => c.code === toCurrency);

    if (fromCurrencyData && toCurrencyData && amount) {
      const numericAmount = parseFloat(amount.replace(/[^\d.]/g, ''));
      if (!isNaN(numericAmount) && numericAmount >= 0) {
        let result;

        if (mode === "tenho") {
          // Lógica original: "Tenho X, quanto preciso de Y"
          if (fromCurrency === "BRL" && toCurrency !== "BRL") {
            // BRL para moeda estrangeira
            result = numericAmount / toCurrencyData.sellPrice;
          } else if (fromCurrency !== "BRL" && toCurrency === "BRL") {
            // Moeda estrangeira para BRL
            result = numericAmount * fromCurrencyData.buyPrice;
          } else if (fromCurrency === "BRL" && toCurrency === "BRL") {
            // BRL para BRL (mesmo valor)
            result = numericAmount;
          } else {
            // Evitar conversões entre duas moedas estrangeiras
            result = 0;
          }
        } else {
          // Lógica inversa: "Preciso de X, quanto tenho que dar de Y"
          if (fromCurrency === "BRL" && toCurrency !== "BRL") {
            // Preciso de moeda estrangeira, quanto em BRL
            result = numericAmount * toCurrencyData.sellPrice;
          } else if (fromCurrency !== "BRL" && toCurrency === "BRL") {
            // Preciso de BRL, quanto em moeda estrangeira
            result = numericAmount / fromCurrencyData.buyPrice;
          } else if (fromCurrency === "BRL" && toCurrency === "BRL") {
            // BRL para BRL (mesmo valor)
            result = numericAmount;
          } else {
            // Evitar conversões entre duas moedas estrangeiras
            result = 0;
          }
        }

        const rawResult = result;
        const roundedResult = toCurrency === "BRL" ? result : Math.round(result);
        setIsApproximateValue(rawResult !== roundedResult);

        setConvertedAmount(formatCurrencyValue(toCurrency, roundedResult));
      } else {
        setConvertedAmount("0");
        setIsApproximateValue(false);
      }
    }
  }, [fromCurrency, toCurrency, amount, allCurrencies, mode]);

  const handleFromCurrencyChange = (code: string) => {
    setFromCurrency(code);
    setShowFromDropdown(false);
    // Reset toCurrency if fromCurrency is not BRL
    if (code !== "BRL") {
      setToCurrency("BRL");
    }
  };



  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, '');
    setAmount(value);
  };

  const handleSwapCurrencies = () => {
    // Só permitir troca se uma das moedas for BRL
    if ((fromCurrency === "BRL" && toCurrency !== "BRL") || 
        (fromCurrency !== "BRL" && toCurrency === "BRL")) {
      setFromCurrency(toCurrency);
      setToCurrency(fromCurrency);
    }
  };

  return (
    <div className="currency-converter relative max-w-3xl mx-auto mt-1 mb-4">
      <div className="bg-[#252525] p-3 pb-8 sm:p-6 sm:pb-12 rounded-xl">
        <h2 className="text-[#f3b234] text-xl font-semibold mb-2 sm:mb-3 text-center">Conversor de Moedas</h2>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <div className="flex items-center justify-center mb-2">
              <button
                onClick={() => setMode("tenho")}
                className={`px-3 py-1 rounded-l-lg text-sm font-medium transition-all duration-150 ${
                  mode === "tenho" 
                    ? "bg-[#f3b234] text-[#1a1a1a] shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] border border-[#e6a429]" 
                    : "bg-white text-black hover:bg-gray-100 shadow-[0_2px_4px_rgba(0,0,0,0.1)] border border-gray-200"
                }`}
              >
                Tenho
              </button>
              <button
                onClick={() => setMode("preciso")}
                className={`px-3 py-1 rounded-r-lg text-sm font-medium transition-all duration-150 ${
                  mode === "preciso" 
                    ? "bg-[#f3b234] text-[#1a1a1a] shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] border border-[#e6a429]" 
                    : "bg-white text-black hover:bg-gray-100 shadow-[0_2px_4px_rgba(0,0,0,0.1)] border border-gray-200"
                }`}
              >
                Preciso de
              </button>
            </div>
            <div className="bg-white rounded-xl flex justify-between items-center p-3 mb-3 sm:mb-0 h-14 sm:h-[4.5rem]">
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                className="text-xl sm:text-2xl font-medium bg-white border-none focus:ring-0 focus:outline-none text-black w-3/5"
                placeholder="0"
              />

              <div 
                className="currency-dropdown flex items-center cursor-pointer" 
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
            </div>

            {showFromDropdown && !showToDropdown && (
              <div 
                className="absolute inset-x-0 w-full bg-white rounded-b-xl shadow-xl z-[1000] max-h-80 overflow-y-auto currency-dropdown-list"
                style={{
                  top: 'calc(100% - 12px)',
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  marginTop: '-1px'
                }}
              >
                {allCurrencies
                  .sort((a, b) => (a.code === "BRL" ? -1 : b.code === "BRL" ? 1 : 0))
                  .map((currency) => (
                  <div 
                    key={`from-${currency.code}`}
                    className="flex items-center p-3 hover:bg-[#f4ba4a] cursor-pointer border-b border-black/10"
                    onClick={() => {
                      const newFromCurrency = currency.code;
                      if (newFromCurrency === "BRL") {
                        // Se BRL for selecionado, define o segundo campo como a segunda moeda da lista
                        const secondCurrency = allCurrencies.find(c => c.code !== "BRL")?.code || "USD";
                        setFromCurrency(newFromCurrency);
                        setToCurrency(secondCurrency);
                      } else if (toCurrency === "BRL") {
                        // Se já estiver BRL no segundo campo, mantém
                        setFromCurrency(newFromCurrency);
                      } else {
                        // Se não for BRL, força BRL no segundo campo
                        setFromCurrency(newFromCurrency);
                        setToCurrency("BRL");
                      }
                      setShowFromDropdown(false);
                    }}
                  >
                    <CurrencyLogo code={currency.code} className="w-5 h-5 mr-3" />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-black">{currency.code}</span>
                      <span className="text-xs text-black/70">{currency.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-center items-center z-10 relative sm:mx-4 sm:flex-shrink-0 sm:mt-8">
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

          <div className="relative flex-1">
            <div className="mb-2 h-[1.75rem]"></div>
            <div className="bg-white rounded-xl flex justify-between items-center p-3 h-14 sm:h-[4.5rem] mb-3 sm:mb-0"></div>
              <div className="text-xl sm:text-2xl font-medium text-black truncate w-3/5">
                {convertedAmount ? convertedAmount : "0"}
              </div>

              <div 
                className="currency-dropdown flex items-center cursor-pointer"
                onClick={() => {
                  setShowFromDropdown(false);
                  setShowToDropdown(!showToDropdown);
                }}
              >
                <span className="text-xl sm:text-2xl font-bold mr-1">{toCurrency}</span>
                <CurrencyLogo code={toCurrency} className="w-5 h-5 mr-2"/>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L12 15L18 9" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {showToDropdown && (
              <div 
                className="absolute inset-x-0 w-full bg-white rounded-b-xl shadow-xl z-[1000] max-h-80 overflow-y-auto currency-dropdown-list"
                style={{
                  top: 'calc(100% - 12px)',
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  marginTop: '-1px'
                }}
              >
                {allCurrencies
                  .sort((a, b) => (a.code === "BRL" ? -1 : b.code === "BRL" ? 1 : 0))
                  .map((currency) => (
                  <div 
                    key={`to-${currency.code}`}
                    className="flex items-center p-3 hover:bg-[#f4ba4a] cursor-pointer border-b border-black/10"
                    onClick={() => {
                      const newToCurrency = currency.code;
                      setToCurrency(newToCurrency);
                      setShowToDropdown(false);
                      
                      // Se ambas as moedas ficaram iguais, ajustar o primeiro campo
                      if (fromCurrency === newToCurrency) {
                        if (newToCurrency === "BRL") {
                          // Se ambas são BRL, mudar o primeiro campo para USD
                          const firstForeignCurrency = allCurrencies.find(c => c.code !== "BRL")?.code || "USD";
                          setFromCurrency(firstForeignCurrency);
                        } else {
                          // Se ambas são moedas estrangeiras, mudar o primeiro campo para BRL
                          setFromCurrency("BRL");
                        }
                      }
                    }}
                  >
                    <CurrencyLogo code={currency.code} className="w-5 h-5 mr-3" />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-black">{currency.code}</span>
                      <span className="text-xs text-black/70">{currency.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

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