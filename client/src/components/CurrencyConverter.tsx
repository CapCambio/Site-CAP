
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { formatCurrencyValue } from '../lib/currency';
import { Currency } from '../lib/types';
import { CurrencyLogo } from './CurrencyLogo';

interface CurrencyConverterProps {
  currencies: Currency[];
}

export function CurrencyConverter({ currencies }: CurrencyConverterProps) {
  const [fromCurrency, setFromCurrency] = useState('BRL');
  const [toCurrency, setToCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [convertedAmount, setConvertedAmount] = useState('');

  const allCurrencies = [
    { name: 'Real Brasileiro', code: 'BRL', buyPrice: 1, sellPrice: 1 },
    ...currencies
  ];

  useEffect(() => {
    if (amount && fromCurrency && toCurrency) {
      let result = 0;
      const value = parseFloat(amount);

      if (fromCurrency === 'BRL') {
        const targetCurrency = currencies.find(c => c.code === toCurrency);
        if (targetCurrency) {
          result = value / targetCurrency.sellPrice;
        }
      } else {
        const sourceCurrency = currencies.find(c => c.code === fromCurrency);
        if (sourceCurrency) {
          result = value * sourceCurrency.buyPrice;
        }
      }

      setConvertedAmount(formatCurrencyValue(toCurrency, result));
    } else {
      setConvertedAmount('');
    }
  }, [amount, fromCurrency, toCurrency, currencies]);

  const handleFromCurrencyChange = (value: string) => {
    setFromCurrency(value);
    if (value !== 'BRL') {
      setToCurrency('BRL');
    }
  };

  return (
    <Card className="p-6 mb-8 bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a]">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="block text-lg font-semibold text-white mb-2">Tenho</label>
          <div className="flex gap-3">
            <Select value={fromCurrency} onValueChange={handleFromCurrencyChange}>
              <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
                <div className="flex items-center gap-2">
                  <CurrencyLogo code={fromCurrency} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {allCurrencies.map(currency => (
                  <SelectItem key={currency.code} value={currency.code}>
                    <div className="flex items-center gap-2">
                      <CurrencyLogo code={currency.code} />
                      {currency.code} - {currency.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-lg font-semibold text-white mb-2">Troco por</label>
          <div className="flex gap-3">
            <Select 
              value={toCurrency} 
              onValueChange={setToCurrency}
              disabled={fromCurrency !== 'BRL'}
            >
              <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
                <div className="flex items-center gap-2">
                  <CurrencyLogo code={toCurrency} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {fromCurrency === 'BRL' ? (
                  currencies.map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center gap-2">
                        <CurrencyLogo code={currency.code} />
                        {currency.code} - {currency.name}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="BRL">
                    <div className="flex items-center gap-2">
                      <CurrencyLogo code="BRL" />
                      BRL - Real Brasileiro
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <Input
              type="text"
              readOnly
              value={convertedAmount}
              placeholder="0,00"
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
