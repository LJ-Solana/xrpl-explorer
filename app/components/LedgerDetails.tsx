"use client";

import React, { useEffect, useState } from 'react';
// import { Client } from 'xrpl';
import DetailCard from './DetailCard';
import DetailItem from './DetailItem';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { useLedgerProgress } from '../context/LedgerProgressContext';

interface LedgerData {
  ledger_index: number;
  ledger_hash: string;
  parent_hash: string;
  close_time: number;
  close_time_resolution: number;
  closed: boolean;
  transaction_hash: string;
  account_hash: string;
  total_coins: string;
  transactions?: string[];
}

interface TransactionData {
  hash: string;
  TransactionType: string;
  Account: string;
  Destination?: string;
  Amount?: string | { value: string; currency: string };
  Fee: string;
}

interface LedgerDetailsProps {
  identifier: string;
}

function formatXrp(drops: string | number): string {
  if (drops === undefined || drops === null) return 'N/A';
  const numDrops = typeof drops === 'string' ? parseInt(drops, 10) : drops;
  if (isNaN(numDrops)) return 'Invalid Amount';
  return (numDrops / 1000000).toLocaleString('en-US', { maximumFractionDigits: 6 });
}

function formatTimestamp(rippleTimestamp: number): string {
  if (rippleTimestamp === undefined || rippleTimestamp === null) return 'N/A';
  const timestamp = (rippleTimestamp + 946684800) * 1000;
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid Date';
  return date.toLocaleString();
}

const LedgerDetails: React.FC<LedgerDetailsProps> = ({ identifier }) => {
  const { client } = useLedgerProgress();
  const [ledgerData, setLedgerData] = useState<LedgerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txDetails, setTxDetails] = useState<TransactionData[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    if (!identifier || !client || !client.isConnected()) return;

    let isMounted = true;
    const fetchLedgerData = async () => {
      setIsLoading(true);
      setError(null);
      setLedgerData(null);
      setTxDetails([]);
      try {
        const request: any = {
          command: 'ledger',
          transactions: true,
          expand: false,
        };
        if (/^[0-9]+$/.test(identifier)) {
          request.ledger_index = parseInt(identifier, 10);
        } else if (/^[A-Fa-f0-9]{64}$/.test(identifier)) {
          request.ledger_hash = identifier;
        } else {
          throw new Error("Invalid ledger identifier. Use index or hash.");
        }

        const response = await client.request(request);
        if (!isMounted) return;
        const ledgerResult = response.result as { ledger: LedgerData };
        if (ledgerResult?.ledger) {
          setLedgerData(ledgerResult.ledger);
          // Fetch transaction details if there are transactions
          if (ledgerResult.ledger.transactions && ledgerResult.ledger.transactions.length > 0) {
            setTxLoading(true);
            const txHashes = ledgerResult.ledger.transactions;
            const txPromises = txHashes.map((hash) =>
              client.request({ command: 'tx', transaction: hash, binary: false })
                .then(res => {
                  const tx = res.result;
                  const txJson = tx.tx_json || tx;
                  return {
                    hash: tx.hash,
                    TransactionType: txJson.TransactionType,
                    Account: txJson.Account,
                    Destination: 'Destination' in txJson ? txJson.Destination : undefined,
                    Amount: 'Amount' in txJson ? txJson.Amount : undefined,
                    Fee: txJson.Fee,
                  } as TransactionData;
                })
                .catch(() => null)
            );
            const txs = (await Promise.all(txPromises)).filter(Boolean) as TransactionData[];
            if (isMounted) setTxDetails(txs);
            setTxLoading(false);
          }
        } else {
          throw new Error("Ledger data not found in response.");
        }
      } catch (err) {
        console.error("Error fetching ledger data:", err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch ledger data. Is the index/hash correct?');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLedgerData();
    return () => { isMounted = false; };
  }, [identifier, client]);

  const handleLedgerClosed = (ledger: LedgerData) => {
    console.log("New ledger received via WebSocket:", ledger);
    setLedgerData(ledger);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!ledgerData && !isLoading) return <p className="text-center text-gray-500">No ledger data found or identifier is invalid.</p>;
  if (!ledgerData) return null;

  return (
    <DetailCard title={`Ledger Details: ${ledgerData.ledger_index}`}>
      <DetailItem label="Ledger Index" value={ledgerData.ledger_index.toString()} />
      <DetailItem label="Ledger Hash" value={ledgerData.ledger_hash} />
      <DetailItem label="Parent Hash" value={ledgerData.parent_hash} />
      <DetailItem label="Close Time" value={formatTimestamp(ledgerData.close_time)} />
      <DetailItem label="Close Time Resolution" value={ledgerData.close_time_resolution.toString()} />
      <DetailItem label="Closed" value={ledgerData.closed ? 'Yes' : 'No'} />
      <DetailItem label="Transaction Hash" value={ledgerData.transaction_hash} />
      <DetailItem label="Account Hash" value={ledgerData.account_hash} />
      <DetailItem label="Total XRP" value={formatXrp(ledgerData.total_coins) + ' XRP'} />
      <DetailItem label="Transactions" value={ledgerData.transactions?.length?.toString() ?? '0'} />
      {ledgerData.transactions && ledgerData.transactions.length > 0 && (
        <div className="mt-4">
          <h3 className="text-md font-semibold text-gray-300 mb-2">Transactions:</h3>
          {txLoading ? (
            <div className="text-center text-gray-400 py-4">Loading transactions...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left bg-white/5 rounded-xl border border-purple-100 shadow-sm backdrop-blur-md">
                <thead className="bg-purple-50/10 rounded-t-xl">
                  <tr>
                    <th className="px-3 py-2 text-purple-400 font-semibold rounded-tl-xl">Hash</th>
                    <th className="px-3 py-2 text-purple-400 font-semibold">Type</th>
                    <th className="px-3 py-2 text-purple-400 font-semibold">Account</th>
                    <th className="px-3 py-2 text-purple-400 font-semibold">Destination</th>
                    <th className="px-3 py-2 text-purple-400 font-semibold">Amount</th>
                    <th className="px-3 py-2 text-purple-400 font-semibold rounded-tr-xl">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {txDetails.map((tx, idx) => (
                    <tr
                      key={tx.hash}
                      className={
                        `border-b border-purple-50/20 last:border-0 transition ` +
                        (idx % 2 === 0 ? 'bg-white/0' : 'bg-purple-50/5') +
                        ' hover:bg-purple-100/10'
                      }
                    >
                      <td className="px-3 py-2 break-all">
                        <a href={`#tx/${tx.hash}`} className="text-blue-400 hover:underline">{tx.hash}</a>
                      </td>
                      <td className="px-3 py-2">{tx.TransactionType}</td>
                      <td className="px-3 py-2">{tx.Account}</td>
                      <td className="px-3 py-2">{tx.Destination ?? '-'}</td>
                      <td className="px-3 py-2">
                        {typeof tx.Amount === 'string'
                          ? `${formatXrp(tx.Amount)} XRP`
                          : tx.Amount?.value && tx.Amount?.currency
                          ? `${tx.Amount.value} ${tx.Amount.currency}`
                          : '-'}
                      </td>
                      <td className="px-3 py-2">{formatXrp(tx.Fee)} XRP</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DetailCard>
  );
};

export default LedgerDetails; 