import { useState, useEffect } from "react";
import { Currency } from "@/lib/types";
import { formatCurrencyValue } from "@/lib/currency";
import { CurrencyLogo } from "./CurrencyLogo";
import { ArrowDown } from "lucide-react";

interface CurrencyConverterProps {
  currencies: Currency[];
}

export function CurrencyConverter({ currencies }: CurrencyConverterProps) {
  const [fromCurrency, setFromCurrency] = useState<string>("BRL");
  const [toCurrency, setToCurrency] = useState<string>("USD");
  const [amount, setAmount] = useState<string>("1");
  const [convertedAmount, setConvertedAmount] = useState<string>("");
  const [showFromDropdown, setShowFromDropdown] = useState<boolean>(false);
  const [showToDropdown, setShowToDropdown] = useState<boolean>(false);
  const [exchangeRate, setExchangeRate] = useState<string>("");

  // Adicionar Real à lista de moedas disponíveis
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
      setExchangeRate("");
      return;
    }

    let result: number;
    let rate: number;

    // Se o valor convertido for de BRL para moeda estrangeira
    if (fromCurrency === "BRL") {
      const targetCurrency = currencies.find(c => c.code === toCurrency);
      if (!targetCurrency) return;
      
      rate = targetCurrency.sellPrice;
      result = Number(amount) / rate;
      
      setExchangeRate(`1 BRL = ${formatCurrencyValue(toCurrency, 1 / rate)} ${toCurrency}`);
    } 
    // Se o valor convertido for de moeda estrangeira para BRL
    else {
      const sourceCurrency = currencies.find(c => c.code === fromCurrency);
      if (!sourceCurrency) return;
      
      rate = sourceCurrency.buyPrice;
      result = Number(amount) * rate;
      
      setExchangeRate(`1 ${fromCurrency} = ${formatCurrencyValue("BRL", rate)} BRL`);
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
    
    // Se a moeda de origem não for BRL, a moeda de destino deve ser BRL
    if (code !== "BRL") {
      setToCurrency("BRL");
    } 
    // Se a moeda de origem for BRL, podemos definir USD como padrão para destino
    else if (toCurrency === "BRL") {
      setToCurrency("USD");
    }
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

  // Encontrar os objetos de moeda selecionados
  const selectedFromCurrency = allCurrencies.find(c => c.code === fromCurrency);
  const selectedToCurrency = allCurrencies.find(c => c.code === toCurrency);

  return (
    <div className="bg-black p-4 rounded-lg my-6 max-w-3xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Primeiro bloco: Entrada de valor e seleção de moeda */}
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold">DE</span>
            <div className="relative currency-dropdown">
              <button 
                className="flex items-center space-x-2 bg-[#f3b234] text-black px-4 py-2 rounded-md"
                onClick={() => setShowFromDropdown(!showFromDropdown)}
              >
                <CurrencyLogo code={fromCurrency} className="w-5 h-5" />
                <span>{fromCurrency}</span>
                <ArrowDown className="w-4 h-4" />
              </button>
              
              {showFromDropdown && (
                <div className="absolute right-0 mt-1 w-56 max-h-60 overflow-y-auto z-10 bg-white rounded-md shadow-lg">
                  {allCurrencies.map((currency) => (
                    <button 
                      key={`from-${currency.code}`}
                      className="w-full flex items-center p-2 hover:bg-gray-100 text-left"
                      onClick={() => handleFromCurrencyChange(currency.code)}
                    >
                      <CurrencyLogo code={currency.code} className="w-5 h-5 mr-2" />
                      <span className="font-medium">{currency.code}</span>
                      <span className="text-xs ml-2 text-gray-500">{currency.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <input
            type="text"
            value={amount}
            onChange={handleAmountChange}
            className="w-full text-3xl font-medium border-none focus:ring-0 focus:outline-none"
            placeholder="0.00"
          />
          
          <div className="text-xs text-gray-500 mt-1">
            {selectedFromCurrency && (
              <span>{selectedFromCurrency.name}</span>
            )}
          </div>
        </div>
        
        {/* Segundo bloco: Valor convertido e seleção de moeda */}
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold">PARA</span>
            <div className="relative currency-dropdown">
              <button 
                className="flex items-center space-x-2 bg-[#f3b234] text-black px-4 py-2 rounded-md"
                onClick={() => setShowToDropdown(!showToDropdown)}
                disabled={fromCurrency !== "BRL"}
              >
                <CurrencyLogo code={toCurrency} className="w-5 h-5" />
                <span>{toCurrency}</span>
                <ArrowDown className="w-4 h-4" />
              </button>
              
              {showToDropdown && fromCurrency === "BRL" && (
                <div className="absolute right-0 mt-1 w-56 max-h-60 overflow-y-auto z-10 bg-white rounded-md shadow-lg">
                  {currencies.map((currency) => (
                    <button 
                      key={`to-${currency.code}`}
                      className="w-full flex items-center p-2 hover:bg-gray-100 text-left"
                      onClick={() => handleToCurrencyChange(currency.code)}
                    >
                      <CurrencyLogo code={currency.code} className="w-5 h-5 mr-2" />
                      <span className="font-medium">{currency.code}</span>
                      <span className="text-xs ml-2 text-gray-500">{currency.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-3xl font-medium text-gray-800">
            {convertedAmount || "0"}
          </div>
          
          <div className="text-xs text-gray-500 mt-1">
            {selectedToCurrency && (
              <span>{selectedToCurrency.name}</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Taxa de câmbio */}
      <div className="text-center text-sm text-white mt-3">
        {exchangeRate && (
          <div className="text-sm">{exchangeRate}</div>
        )}
      </div>
    </div>
  );
}