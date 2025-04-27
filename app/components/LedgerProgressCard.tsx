"use client";

import React from 'react';
import DetailCard from './DetailCard';
import { useLedgerProgress } from '../context/LedgerProgressContext';

const LedgerProgressCard: React.FC = () => {
  const { ledgerIndex, progress, timeLeft } = useLedgerProgress();

  return (
    <DetailCard
      title={`Ledger ${ledgerIndex ?? '...'}`}
      icon={
        <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /></svg>
      }
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-purple-400 font-semibold">{timeLeft}</span>
        {ledgerIndex && <span className="text-purple-400 font-bold">{ledgerIndex}</span>}
      </div>
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
        <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500" style={{ width: `${Math.round((progress ?? 0) * 100)}%` }}></div>
      </div>
      <div className="text-xs text-gray-400">{((progress ?? 0) * 100).toFixed(2)}%</div>
    </DetailCard>
  );
};

export default LedgerProgressCard; 