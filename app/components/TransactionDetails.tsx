import React, { useEffect, useState } from 'react';
import { useLedgerProgress } from '../context/LedgerProgressContext';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import DetailCard from './DetailCard';
import DetailItem from './DetailItem';

interface TransactionData {
  hash: string;
  TransactionType: string;
  ledger_index: number;
  date: number;
  Account: string;
  Destination?: string;
  Amount?: string | { value: string; currency: string };
  Fee: string;
  Sequence: number;
  meta?: {
    TransactionResult: string;
    AffectedNodes?: any[];
  };
}

interface TransactionDetailsProps {
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

const TransactionDetails: React.FC<TransactionDetailsProps> = ({ identifier }) => {
  const { client } = useLedgerProgress();
  const [txData, setTxData] = useState<TransactionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!identifier || !client || !client.isConnected()) return;

    let isMounted = true;
    const fetchTxData = async () => {
      setIsLoading(true);
      setError(null);
      setTxData(null);
      try {
        const response = await client.request({
          command: 'tx',
          transaction: identifier,
          binary: false,
        });
        if (!isMounted) return;
        if (response.result) {
          const txResult = response.result as any;
          setTxData({
            hash: txResult.hash,
            TransactionType: txResult.TransactionType,
            ledger_index: txResult.ledger_index,
            date: txResult.date,
            Account: txResult.Account,
            Destination: txResult.Destination,
            Amount: txResult.Amount,
            Fee: txResult.Fee,
            Sequence: txResult.Sequence,
            meta: txResult.meta
          });
        } else {
          throw new Error('Transaction data not found in response.');
        }
      } catch (err) {
        console.error('Error fetching transaction data:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch transaction data. Is the hash correct?');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTxData();
    return () => { isMounted = false; };
  }, [identifier, client]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!txData && !isLoading) return <p className="text-center text-gray-500">No transaction data found or hash is invalid.</p>;
  if (!txData) return null;

  const tx = txData;
  const meta = txData.meta;
  const status = meta?.TransactionResult ?? 'N/A';
  const isSuccess = status.startsWith('tes');

  return (
    <DetailCard title="Transaction Details">
      <DetailItem label="Hash" value={tx.hash} />
      <DetailItem label="Type" value={tx.TransactionType} />
      <DetailItem label="Status" value={status} />
      <DetailItem label="Result" value={isSuccess ? 'Success' : 'Failed/Other'} />
      <DetailItem label="Ledger Index" value={tx.ledger_index.toString()} isHashLink={true} href={`#ledger/${tx.ledger_index}`} />
      <DetailItem label="Timestamp" value={formatTimestamp(tx.date)} />
      <DetailItem label="Sender" value={tx.Account} isHashLink={true} href={`#account/${tx.Account}`} />
      {tx.TransactionType === 'Payment' && tx.Destination && (
        <>
          <DetailItem label="Destination" value={tx.Destination} isHashLink={true} href={`#account/${tx.Destination}`} />
          <DetailItem
            label="Amount"
            value={typeof tx.Amount === 'string'
              ? `${formatXrp(tx.Amount)} XRP`
              : tx.Amount?.value && tx.Amount?.currency
              ? `${tx.Amount.value} ${tx.Amount.currency}`
              : 'N/A'
            }
          />
        </>
      )}
      <DetailItem label="Fee" value={`${formatXrp(tx.Fee)} XRP`} />
      <DetailItem label="Sequence" value={tx.Sequence.toString()} />
      {meta && <DetailItem label="Affected Nodes" value={meta.AffectedNodes?.length?.toString() ?? 'N/A'} />}
    </DetailCard>
  );
};

export default TransactionDetails; 