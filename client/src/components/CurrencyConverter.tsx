
import { useState, useEffect } from "react";
import { Currency } from "@/lib/types";
import { formatCurrencyValue } from "@/lib/currency";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CurrencyLogo } from "./CurrencyLogo";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CurrencyConverterProps {
  currencies: Currency[];
}

export function CurrencyConverter({ currencies }: CurrencyConverterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fromCurrency, setFromCurrency] = useState<string>("BRL");
  const [toCurrency, setToCurrency] = useState<string>("USD");
  const [amount, setAmount] = useState<string>("1");
  const [convertedAmount, setConvertedAmount] = useState<string>("");
  const [exchangeRate, setExchangeRate] = useState<string>("");

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

    if (fromCurrency === "BRL") {
      const targetCurrency = currencies.find(c => c.code === toCurrency);
      if (!targetCurrency) return;
      
      rate = targetCurrency.sellPrice;
      result = Number(amount) / rate;
      
      setExchangeRate(`1 BRL = ${formatCurrencyValue(toCurrency, 1 / rate)} ${toCurrency}`);
    } else {
      const sourceCurrency = currencies.find(c => c.code === fromCurrency);
      if (!sourceCurrency) return;
      
      rate = sourceCurrency.buyPrice;
      result = Number(amount) * rate;
      
      setExchangeRate(`1 ${fromCurrency} = ${formatCurrencyValue("BRL", rate)} BRL`);
    }

    let stringValue = result.toFixed(5);
    stringValue = stringValue.replace(/\.?0+$/, "");
    if (stringValue.endsWith('.')) {
      stringValue = stringValue.slice(0, -1);
    }
    
    setConvertedAmount(stringValue);
  };

  const handleFromCurrencyChange = (value: string) => {
    setFromCurrency(value);
    if (value !== "BRL") {
      setToCurrency("BRL");
    } else if (toCurrency === "BRL") {
      setToCurrency("USD");
    }
  };

  const handleToCurrencyChange = (value: string) => {
    setToCurrency(value);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, '');
    setAmount(value);
  };

  return (
    <div className="my-6 max-w-3xl mx-auto">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <img 
            src="/calculator-icon.png" 
            alt="Calculadora" 
            className="w-6 h-6"
          />
          <span className="font-bold">Calculadora de Câmbio</span>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <div className="bg-white rounded-lg shadow-md p-5 mt-2">
          <div className="flex items-center justify-center gap-2 mb-5">
            <img 
              src="/calculator-icon.png" 
              alt="Calculadora" 
              className="w-6 h-6"
            />
            <h2 className="text-xl font-bold text-[#1a1a1a]">Calculadora de Câmbio</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label htmlFor="amount" className="text-sm font-medium text-gray-700">Tenho</label>
                <Select value={fromCurrency} onValueChange={handleFromCurrencyChange}>
                  <SelectTrigger className="w-[140px] border-[#f3b234]">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCurrencies.map((currency) => (
                      <SelectItem key={`from-${currency.code}`} value={currency.code}>
                        <div className="flex items-center">
                          <CurrencyLogo code={currency.code} className="w-4 h-4 mr-2" />
                          {currency.code}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="relative">
                <Input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  className="pr-12 text-lg font-medium focus:ring-[#f3b234] focus:border-[#f3b234]"
                  placeholder="0.00"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
                  <CurrencyLogo code={fromCurrency} className="w-5 h-5 mr-1" />
                  <span className="text-sm font-medium text-gray-600">{fromCurrency}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label htmlFor="converted" className="text-sm font-medium text-gray-700">Troco por</label>
                <Select 
                  value={toCurrency} 
                  onValueChange={handleToCurrencyChange}
                  disabled={fromCurrency !== "BRL"}
                >
                  <SelectTrigger className="w-[140px] border-[#f3b234]">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {fromCurrency === "BRL" ? (
                      currencies.map((currency) => (
                        <SelectItem key={`to-${currency.code}`} value={currency.code}>
                          <div className="flex items-center">
                            <CurrencyLogo code={currency.code} className="w-4 h-4 mr-2" />
                            {currency.code}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="BRL">
                        <div className="flex items-center">
                          <CurrencyLogo code="BRL" className="w-4 h-4 mr-2" />
                          BRL
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="relative">
                <Input
                  id="converted"
                  type="text"
                  value={convertedAmount}
                  readOnly
                  className="pr-12 text-lg font-medium"
                  placeholder="0.00"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
                  <CurrencyLogo code={toCurrency} className="w-5 h-5 mr-1" />
                  <span className="text-sm font-medium text-gray-600">{toCurrency}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center text-sm mt-3">
            {exchangeRate && (
              <p className="text-gray-600 font-medium">{exchangeRate}</p>
            )}
            <p className="text-xs mt-1 text-gray-500">
              <span className="font-medium">Cotação de referência:</span> As taxas aplicadas são baseadas nas cotações da tabela abaixo
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
