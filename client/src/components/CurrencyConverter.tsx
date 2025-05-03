
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { formatCurrencyValue } from '../lib/currency';
import { Currency } from '../lib/types';

interface CurrencyConverterProps {
  currencies: Currency[];
}

export function CurrencyConverter({ currencies }: CurrencyConverterProps) {
  const [fromCurrency, setFromCurrency] = useState('BRL');
  const [toCurrency, setToCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [convertedAmount, setConvertedAmount] = useState('');

  // Add BRL to the list of currencies
  const allCurrencies = [
    { name: 'Real Brasileiro', code: 'BRL', buyPrice: 1, sellPrice: 1 },
    ...currencies
  ];

  useEffect(() => {
    if (amount && fromCurrency && toCurrency) {
      let result = 0;
      const value = parseFloat(amount);

      if (fromCurrency === 'BRL') {
        // Converting from BRL to foreign currency
        const targetCurrency = currencies.find(c => c.code === toCurrency);
        if (targetCurrency) {
          result = value / targetCurrency.sellPrice;
        }
      } else {
        // Converting from foreign currency to BRL
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

  // Handle currency selection changes
  const handleFromCurrencyChange = (value: string) => {
    setFromCurrency(value);
    if (value !== 'BRL') {
      setToCurrency('BRL');
    }
  };

  const handleToCurrencyChange = (value: string) => {
    setToCurrency(value);
  };

  return (
    <Card className="p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tenho</label>
          <div className="flex gap-2">
            <Select value={fromCurrency} onValueChange={handleFromCurrencyChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allCurrencies.map(currency => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Valor"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Troco por</label>
          <div className="flex gap-2">
            <Select 
              value={toCurrency} 
              onValueChange={handleToCurrencyChange}
              disabled={fromCurrency !== 'BRL'}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fromCurrency === 'BRL' ? (
                  currencies.map(currency => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="BRL">BRL - Real Brasileiro</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Input
              type="text"
              readOnly
              value={convertedAmount}
              placeholder="Valor convertido"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
