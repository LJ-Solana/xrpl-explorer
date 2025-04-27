"use client";

import React, { useEffect, useState } from 'react';
import DetailCard from './DetailCard';

interface PriceData {
  usd: number;
  usd_market_cap: number;
  usd_24h_change: number;
}

const XRPPriceCard: React.FC = () => {
  const [price, setPrice] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrice = async () => {
      setLoading(true);
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd&include_market_cap=true&include_24hr_change=true');
        const data = await res.json();
        setPrice({
          usd: data.ripple.usd,
          usd_market_cap: data.ripple.usd_market_cap,
          usd_24h_change: data.ripple.usd_24h_change,
        });
      } catch (e) {
        setPrice(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPrice();
  }, []);

  const formatNumber = (num: number, digits = 2) => {
    if (num === undefined || num === null) return '...';
    return num.toLocaleString(undefined, { maximumFractionDigits: digits });
  };

  const formatMarketCap = (num: number) => {
    if (num === undefined || num === null) return '...';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <DetailCard
      title="XRP's Price"
      icon={
        <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      }
    >
      <div className="flex items-end justify-between">
        <span className="text-4xl font-bold text-white">
          {loading ? '...' : `$${formatNumber(price?.usd ?? 0, 4)}`}
        </span>
        <span className="text-purple-400 text-sm">
          {loading ? '...' : `${formatMarketCap(price?.usd_market_cap ?? 0)} Market Cap`}
        </span>
      </div>
      <div className="mt-2">
        {/* Placeholder for chart */}
        <svg width="100%" height="60" viewBox="0 0 200 60" fill="none"><path d="M0,50 Q50,10 100,30 T200,40" stroke="url(#grad)" strokeWidth="4" fill="none"/><defs><linearGradient id="grad" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#a78bfa"/><stop offset="1" stopColor="#38bdf8"/></linearGradient></defs></svg>
      </div>
      <div className="mt-2 flex justify-between text-xs">
        <span className="text-gray-400">via CoinGecko</span>
        <span className={
          loading ? 'text-gray-400' : (price && price.usd_24h_change < 0 ? 'text-red-400' : 'text-green-400')
        }>
          {loading ? '...' : `${price?.usd_24h_change?.toFixed(2)}% vs yesterday`}
        </span>
      </div>
    </DetailCard>
  );
};

export default XRPPriceCard; 