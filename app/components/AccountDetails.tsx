"use client";

import React, { useState, useEffect } from 'react';
import { Client } from 'xrpl';
import DetailCard from './DetailCard';
import DetailItem from './DetailItem';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

// Helper function
function formatXrp(drops: string | number): string {
  if (drops === undefined || drops === null) return 'N/A';
  const numDrops = typeof drops === 'string' ? parseInt(drops, 10) : drops;
  if (isNaN(numDrops)) return 'Invalid Amount';
  return (numDrops / 1000000).toLocaleString('en-US', { maximumFractionDigits: 6 });
}

interface AccountData {
  Account: string;
  Balance: string;
  Sequence: number;
  OwnerCount: number;
}

interface TransactionInfo {
  tx?: {
    hash: string;
    TransactionType: string;
    ledger_index: number;
    date: number;
    Account: string;
    Destination?: string;
    Amount?: string | { value: string; currency: string };
    Fee: string;
    Sequence: number;
  };
  meta?: {
    TransactionResult: string;
  };
}

interface AccountDetailsProps {
  identifier: string;
  client: Client | null;
}

const AccountDetails: React.FC<AccountDetailsProps> = ({ identifier, client }) => {
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!identifier || !client || !client.isConnected()) return;

    let isMounted = true;
    const fetchAccountData = async () => {
      setIsLoading(true);
      setError(null);
      setAccountData(null);
      setTransactions([]);
      try {
        const infoResponse = await client.request({
          command: 'account_info',
          account: identifier,
          ledger_index: 'validated',
        });
        if (!isMounted) return;
        if (infoResponse.result?.account_data) {
          setAccountData(infoResponse.result.account_data as AccountData);
        } else {
          throw new Error("Account data not found in response.");
        }

        const txResponse = await client.request({
          command: 'account_tx',
          account: identifier,
          ledger_index_min: -1,
          ledger_index_max: -1,
          limit: 10,
          forward: false,
        });
        if (!isMounted) return;
        if (txResponse.result?.transactions) {
          setTransactions(txResponse.result.transactions as TransactionInfo[]);
        } else {
          setTransactions([]);
        }
      } catch (err) {
        console.error("Error fetching account data:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch account data. Is the address correct?');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAccountData();
    return () => { isMounted = false; };
  }, [identifier, client]);

  if (isLoading) return <LoadingSpinner size="lg" text="Loading account details..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!accountData && !isLoading) return <p className="text-center text-gray-500">No account data found or address is invalid.</p>;

  return (
    <>
      {accountData && (
        <DetailCard 
          title="Account Details"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        >
          <DetailItem 
            label="Address" 
            value={accountData.Account}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
          <DetailItem 
            label="XRP Balance" 
            value={`${formatXrp(accountData.Balance)} XRP`}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <DetailItem 
            label="Sequence" 
            value={accountData.Sequence.toString()}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <DetailItem 
            label="Owner Count" 
            value={accountData.OwnerCount.toString()}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
        </DetailCard>
      )}

      <DetailCard 
        title="Recent Transactions"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        }
      >
        {isLoading && !transactions.length ? <LoadingSpinner size="sm" /> : null}
        {!isLoading && transactions.length === 0 ? (
          <p className="text-sm text-gray-500">No transactions found for this account.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {transactions.map((txInfo, index) => (
              <li key={txInfo.tx?.hash || txInfo.meta?.TransactionResult || index} className="py-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">
                      Tx Hash: <a href={`#tx/${txInfo.tx?.hash}`} className="text-blue-600 hover:underline">{txInfo.tx?.hash}</a>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-sm text-gray-600">Type: {txInfo.tx?.TransactionType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={`text-sm ${txInfo.meta?.TransactionResult?.startsWith('tes') ? 'text-green-600' : 'text-red-600'}`}>
                      Status: {txInfo.meta?.TransactionResult}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DetailCard>
    </>
  );
};

export default AccountDetails; 