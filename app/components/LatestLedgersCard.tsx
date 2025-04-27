"use client";

import React from 'react';
import DetailCard from './DetailCard';
import { useLedgerProgress } from '../context/LedgerProgressContext';

function formatNumber(num: number | string, digits = 0) {
  if (num === undefined || num === null) return '...';
  return Number(num).toLocaleString(undefined, { maximumFractionDigits: digits });
}

function timeAgo(timestamp: number) {
  if (!timestamp) return '';
  const now = Date.now() / 1000;
  const seconds = Math.floor(now - (timestamp + 946684800));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const LatestLedgersCard: React.FC = () => {
  const { recentLedgers, recentLedgersLoading, recentLedgersError } = useLedgerProgress();

  return (
    <DetailCard
      title="Latest Ledgers"
      icon={
        <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      }
    >
      <div className="mb-2">
        <span className="px-2 py-0.5 bg-green-700 text-green-300 text-xs rounded-full align-middle">Live</span>
      </div>
      {recentLedgersLoading ? (
        <div className="text-center text-gray-400 py-8">Loading...</div>
      ) : recentLedgersError ? (
        <div className="text-center text-red-400 py-8">{recentLedgersError}</div>
      ) : recentLedgers.length === 0 ? (
        <div className="text-center text-gray-400 py-8">No ledgers found.</div>
      ) : (
        <ul className="divide-y divide-gray-800">
          {recentLedgers.map((ledger) => (
            <li key={ledger.ledger_index} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2" /></svg>
                <span className="font-mono text-blue-300">{ledger.ledger_index}</span>
              </div>
              <div className="text-xs text-gray-400">{timeAgo(ledger.close_time)}</div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2 mt-4">
        <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-blue-300 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 justify-center transition">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2" /></svg>
          Pause live updates
        </button>
        <button className="flex-1 bg-blue-900 hover:bg-blue-800 text-blue-300 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 justify-center transition">
          View all ledgers →
        </button>
      </div>
    </DetailCard>
  );
};

export default LatestLedgersCard; 