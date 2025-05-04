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

  useEffect(() => {
    const fromCurrencyData = allCurrencies.find(c => c.code === fromCurrency);
    const toCurrencyData = allCurrencies.find(c => c.code === toCurrency);

    if (fromCurrencyData && toCurrencyData && amount) {
      const numericAmount = parseFloat(amount.replace(/[^\d.]/g, ''));
      if (!isNaN(numericAmount) && numericAmount >= 0) {
        let result;

        if (fromCurrency === "BRL") {
          result = numericAmount / toCurrencyData.sellPrice;
        } else if (toCurrency === "BRL") {
          result = numericAmount * fromCurrencyData.buyPrice;
        } else {
          const amountInBRL = numericAmount * fromCurrencyData.buyPrice;
          result = amountInBRL / toCurrencyData.sellPrice;
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
  }, [fromCurrency, toCurrency, amount, allCurrencies]);

  const handleFromCurrencyChange = (code: string) => {
    setFromCurrency(code);
    setShowFromDropdown(false);
    // Reset toCurrency if fromCurrency is not BRL
    if (code !== "BRL") {
      setToCurrency("BRL");
    }
  };

  const handleToCurrencyChange = (code: string) => {
    setToCurrency(code);
    setShowToDropdown(false);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, '');
    setAmount(value);
  };

  const handleSwapCurrencies = () => {
    if (fromCurrency === "BRL") {
      //Allow swap only if fromCurrency is BRL
      setFromCurrency(toCurrency);
      setToCurrency(fromCurrency);
    }
  };

  return (
    <div className="currency-converter relative max-w-3xl mx-auto mt-0 mb-6">
      <div className="bg-[#252525] p-3 pb-8 sm:p-6 sm:pb-12 rounded-xl">
        <h2 className="text-[#f3b234] text-xl font-semibold mb-2 sm:mb-3 text-center">Conversor de Moedas</h2>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
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
                  .filter(currency => currency.code !== toCurrency)
                  .sort((a, b) => (a.code === "BRL" ? -1 : b.code === "BRL" ? 1 : 0))
                  .map((currency) => (
                  <div 
                    key={`from-${currency.code}`}
                    className="flex items-center p-3 hover:bg-[#f4ba4a] cursor-pointer border-b border-black/10"
                    onClick={() => handleFromCurrencyChange(currency.code)}
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

          <div className="flex justify-center items-center z-10 relative sm:mx-4 sm:self-center sm:flex-shrink-0">
            <button
              onClick={handleSwapCurrencies}
              className="bg-black hover:bg-gray-800 transition-colors rounded-lg p-2"
              disabled={fromCurrency !== "BRL"} // Disable swap button if fromCurrency is not BRL
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 8L3 12L7 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 16L21 12L17 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 12H21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="relative flex-1">
            <div className="bg-white rounded-xl flex justify-between items-center p-3 h-14 sm:h-[4.5rem] mt-3 sm:mt-0">
              <div className="text-xl sm:text-2xl font-medium text-black truncate w-3/5">
                {convertedAmount ? convertedAmount : "0"}
              </div>

              <div 
                className={`currency-dropdown flex items-center ${fromCurrency === "BRL" ? "cursor-pointer" : "cursor-not-allowed"}`}
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
                  .filter(currency => currency.code !== fromCurrency && currency.code !== "BRL")
                  .sort((a, b) => (a.code === "BRL" ? -1 : b.code === "BRL" ? 1 : 0))
                  .map((currency) => (
                  <div 
                    key={`to-${currency.code}`}
                    className="flex items-center p-3 hover:bg-[#f4ba4a] cursor-pointer border-b border-black/10"
                    onClick={() => handleToCurrencyChange(currency.code)}
                  >
                    <CurrencyLogo code={currency.code} className="w-5 h-5 mr-3" />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-black">{currency.code}</span>
                      <span className="text-xs text-black/70">{currency.name}</span>
                    </div>
                  </div>
                ))}
                {fromCurrency !== "BRL" && ( //Add BRL to dropdown if fromCurrency is not BRL
                  <div 
                    key={`to-BRL`}
                    className="flex items-center p-3 hover:bg-[#f4ba4a] cursor-pointer border-b border-black/10"
                    onClick={() => handleToCurrencyChange("BRL")}
                  >
                    <CurrencyLogo code={"BRL"} className="w-5 h-5 mr-3" />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-black">BRL</span>
                      <span className="text-xs text-black/70">Real Brasileiro</span>
                    </div>
                  </div>
                )}
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