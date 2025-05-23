"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from 'xrpl';
import SearchBar from './components/SearchBar';
import StatusBar from './components/StatusBar';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import DetailCard from './components/DetailCard';
import DetailItem from './components/DetailItem';
import '@fontsource/inter/index.css';
import XRPPriceCard from './components/XRPPriceCard';
import LedgerProgressCard from './components/LedgerProgressCard';
import TPSCard from './components/TPSCard';
import LatestLedgersCard from './components/LatestLedgersCard';
import LedgerDetails from './components/LedgerDetails';
import { LedgerProgressProvider, useLedgerProgress } from './context/LedgerProgressContext';
import Header from './components/Header';

// --- Type Definitions ---
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

interface AccountData {
  Account: string;
  Balance: string;
  Sequence: number;
  OwnerCount: number;
}

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

interface TransactionInfo {
  tx?: TransactionData;
  meta?: {
    TransactionResult: string;
  };
}

interface ViewState {
  type: 'home' | 'account' | 'tx' | 'ledger' | 'governance';
  identifier: string | null;
}

// --- Configuration ---
const XRPL_NODE = 'wss://s.altnet.rippletest.net:51233'; // Testnet

// --- Helper Functions ---
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

// --- Main Application Components ---

// Account Details View
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

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!accountData && !isLoading) return <p className="text-center text-gray-500">No account data found or address is invalid.</p>;

  return (
    <>
      {accountData && (
        <DetailCard title="Account Details">
          <DetailItem label="Address" value={accountData.Account} />
          <DetailItem label="XRP Balance" value={`${formatXrp(accountData.Balance)} XRP`} />
          <DetailItem label="Sequence" value={accountData.Sequence.toString()} />
          <DetailItem label="Owner Count" value={accountData.OwnerCount.toString()} />
        </DetailCard>
      )}

      <DetailCard title="Recent Transactions (Max 10)">
        {isLoading && !transactions.length ? <LoadingSpinner /> : null}
        {!isLoading && transactions.length === 0 ? (
          <p className="text-sm text-gray-500">No transactions found for this account.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {transactions.map((txInfo, index) => (
              <li key={txInfo.tx?.hash || txInfo.meta?.TransactionResult || index} className="py-3">
                <p className="text-sm font-medium text-gray-900 truncate">
                  Tx Hash: <DetailItem label="" value={txInfo.tx?.hash || ''} isHashLink={true} href={`#tx/${txInfo.tx?.hash}`} />
                </p>
                <p className="text-sm text-gray-600">Type: {txInfo.tx?.TransactionType}</p>
                <p className={`text-sm ${txInfo.meta?.TransactionResult?.startsWith('tes') ? 'text-green-600' : 'text-red-600'}`}>
                  Status: {txInfo.meta?.TransactionResult}
                </p>
                <p className="text-sm text-gray-500">
                  Ledger: <DetailItem label="" value={txInfo.tx?.ledger_index?.toString() || ''} isHashLink={true} href={`#ledger/${txInfo.tx?.ledger_index}`} />
                </p>
              </li>
            ))}
          </ul>
        )}
      </DetailCard>
    </>
  );
};

// Transaction Details View
interface TransactionDetailsProps {
  identifier: string;
  client: Client | null;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({ identifier, client }) => {
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
          throw new Error("Transaction data not found in response.");
        }
      } catch (err) {
        console.error("Error fetching transaction data:", err);
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

// --- Main Page Component (e.g., pages/index.js) ---
export default function HomePage() {
  const [client, setClient] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>({ type: 'home', identifier: null });
  const clientRef = useRef<Client | null>(null);

  // Function to connect to XRPL - runs only on client
  const connectClient = useCallback(async () => {
    if (clientRef.current?.isConnected()) {
      console.log("Already connected.");
      setIsConnected(true);
      setClient(clientRef.current);
      return;
    }
    if (clientRef.current) {
      console.log("Connection attempt already in progress or failed previously.");
      return;
    }

    console.log('Attempting to connect to XRPL Node:', XRPL_NODE);
    setConnectionError(null);
    setIsConnected(false);

    const newClient = new Client(XRPL_NODE);
    clientRef.current = newClient;

    newClient.on('connected', () => {
      console.log('XRPL Client Connected');
      setIsConnected(true);
      setClient(newClient);
      setConnectionError(null);
      newClient.request({ command: 'subscribe', streams: ['ledger'] })
        .then(() => console.log("Subscribed to ledger stream"))
        .catch(err => console.error("Subscription error:", err));
      newClient.request({ command: 'ledger', ledger_index: 'validated' })
        .then(ledgerResponse => {
          if (ledgerResponse.result?.ledger_index) {
            setView({ type: 'ledger', identifier: ledgerResponse.result.ledger_index.toString() });
          }
        })
        .catch(err => console.error("Error fetching initial ledger:", err));
    });

    newClient.on('disconnected', (code) => {
      console.log('XRPL Client Disconnected, code:', code);
      setIsConnected(false);
      setClient(null);
      clientRef.current = null;
      if (code !== 1000) {
        setConnectionError(`Disconnected: Code ${code}. Check connection or node status.`);
      }
    });

    newClient.on('error', (errorCode, errorMessage, data) => {
      console.error('XRPL Client Error:', errorCode, errorMessage, data);
      setConnectionError(`Connection Error: ${errorMessage || 'Unknown error'} (Code: ${errorCode})`);
      setIsConnected(false);
      setClient(null);
      if (clientRef.current?.isConnected()) {
        clientRef.current.disconnect().catch(err => console.error("Disconnect after error failed:", err));
      }
      clientRef.current = null;
    });

    newClient.on('ledgerClosed', (ledger) => {
      console.log(`New ledger closed: ${ledger.ledger_index}`);
      setView({ type: 'ledger', identifier: ledger.ledger_index.toString() });
    });

    try {
      await newClient.connect();
    } catch (error) {
      console.error('XRPL Connection failed:', error);
      const message = error instanceof Error ? error.message : String(error);
      setConnectionError(message || 'Failed to connect to the XRPL node.');
      setIsConnected(false);
      setClient(null);
      clientRef.current = null;
    }
  }, []); // No dependencies needed for connectClient itself

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window !== 'undefined') {
        connectClient(); // Attempt connection on mount

        return () => {
            if (clientRef.current?.isConnected()) {
                console.log('Disconnecting XRPL Client on unmount...');
                clientRef.current.disconnect().catch(err => console.error("Error during disconnect:", err));
            }
            clientRef.current = null; // Clear ref on unmount
            // Reset state related to connection
            setClient(null);
            setIsConnected(false);
            setView({ type: 'home', identifier: null });
            setConnectionError(null);
        };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: run once on mount/unmount

  // Effect for Handling Hash Changes (Runs only on Client)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/' || path === '') {
        setView({ type: 'home', identifier: null });
        return;
      }
      const parts = path.split('/').filter(Boolean);
      if (parts.length === 2) {
        const [type, identifier] = parts;
        if (type === 'account' && identifier.startsWith('r') && identifier.length > 25) {
          setView({ type, identifier }); return;
        } else if (type === 'tx' && identifier.length === 64 && /^[A-Fa-f0-9]+$/.test(identifier)) {
          setView({ type, identifier }); return;
        } else if (type === 'ledger' && (/^[0-9]+$/.test(identifier) || (identifier.length === 64 && /^[A-Fa-f0-9]+$/.test(identifier)))) {
          setView({ type, identifier }); return;
        } else if (type === 'governance') {
          setView({ type: 'governance', identifier: null }); return;
        }
      }
      setView({ type: 'home', identifier: null });
    };
    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle Search Submission
  const handleSearch = (term: string) => {
    if (term.startsWith('r') && term.length > 25) {
      window.history.pushState({}, '', `/account/${term}`);
      setView({ type: 'account', identifier: term });
    } else if (term.length === 64 && /^[A-Fa-f0-9]+$/.test(term)) {
      window.history.pushState({}, '', `/tx/${term}`);
      setView({ type: 'tx', identifier: term });
    } else if (/^[0-9]+$/.test(term)) {
      window.history.pushState({}, '', `/ledger/${term}`);
      setView({ type: 'ledger', identifier: term });
    } else {
      alert('Invalid search term. Please enter a valid Account Address (starts with r), Transaction Hash (64 hex chars), or Ledger Index (number).');
    }
  };

  return (
    <LedgerProgressProvider>
      <div className="min-h-screen flex flex-col font-sans bg-black text-gray-100" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-md z-0" />
        <div className="relative z-10 flex flex-col min-h-screen">
          <Header
            activeTab={view.type === 'governance' ? 'governance' : 'explorer'}
            onTabChange={(tab) => {
              if (tab === 'explorer') {
                setView({ type: 'home', identifier: null });
                window.history.pushState({}, '', '/');
              } else if (tab === 'governance') {
                setView({ type: 'governance', identifier: null });
                window.history.pushState({}, '', '/governance');
              }
            }}
          />

          <main className="container mx-auto p-6 flex-1">
            {view.type === 'tx' ? (
              <div className="max-w-2xl mx-auto pt-8">
                <button
                  className="mb-6 flex items-center gap-2 text-purple-400 hover:text-purple-200 font-semibold text-sm px-3 py-2 rounded transition"
                  onClick={() => {
                    setView({ type: 'home', identifier: null });
                    window.history.pushState({}, '', '/');
                  }}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Back to Dashboard
                </button>
                <TransactionDetails identifier={view.identifier || ''} client={null} />
              </div>
            ) : view.type === 'governance' ? (
              <GovernancePage />
            ) : (
              <>
                <SearchBar onSearch={handleSearch} />
                {client && isConnected && (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
                      <XRPPriceCard />
                      <LedgerProgressCard />
                      <TPSCard />
                      <LatestLedgersCard />
                    </div>
                    <div className="mt-8">
                      {view.type === 'ledger' && (
                        <div className="w-full">
                          <LedgerDetails identifier={view.identifier || ''} />
                        </div>
                      )}
                      {view.type === 'account' && (
                        <AccountDetails identifier={view.identifier || ''} client={null} />
                      )}
                    </div>
                  </>
                )}
                {!client && !connectionError && !isConnected && (
                  <LoadingSpinner size="lg" text="Connecting to XRPL network..." />
                )}
                {connectionError && !isConnected && (
                  <ErrorMessage message={`Connection Failed: ${connectionError}`} />
                )}
              </>
            )}
          </main>

          <footer className="bg-gray-900 border-t border-gray-800 mt-8 rounded-b-xl">
            <div className="container mx-auto p-6 text-center text-gray-500 text-sm">
              <p>Built with Next.js, Tailwind CSS, and xrpl.js</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                {isConnected ? (
                  <span className="flex items-center gap-1 text-green-400"><span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>Connected</span>
                ) : connectionError ? (
                  <span className="flex items-center gap-1 text-red-400"><span className="inline-block w-2 h-2 rounded-full bg-red-400"></span>{connectionError}</span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-400"><span className="inline-block w-2 h-2 rounded-full bg-gray-400"></span>Connecting...</span>
                )}
                <span className="ml-2">Connected to {XRPL_NODE}</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </LedgerProgressProvider>
  );
}

// GovernancePage component
const GovernancePage: React.FC = () => {
  const { client, isConnected } = useLedgerProgress();
  const [validators, setValidators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client || !isConnected) return;
    let isMounted = true;
    const fetchValidators = async () => {
      setLoading(true);
      setError(null);
      try {
        setValidators([]);
      } catch (err) {
        setError('Failed to fetch validator list.');
        setValidators([]);
      } finally {
        setLoading(false);
      }
    };
    fetchValidators();
    return () => { isMounted = false; };
  }, [client, isConnected]);

  return (
    <div className="max-w-3xl mx-auto bg-gray-900 rounded-xl shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold text-purple-400 mb-4">XRPL Governance</h2>
      <p className="mb-6 text-gray-300">This page shows the current Unique Node List (UNL) and validator voting status on the XRPL network.</p>
      {loading ? (
        <div className="text-center text-gray-400 py-8">Loading validators...</div>
      ) : error ? (
        <div className="text-center text-red-400 py-8">{error}</div>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-purple-300 mb-2">Unique Node List (UNL)</h3>
          <div className="overflow-x-auto">
            {/* Placeholder for UNL table, as public validator list is not available from all public nodes */}
            <div className="text-gray-400 py-8">UNL and validator voting status will appear here. (Expand with 'validator_list_sites' or 'server_info' as needed.)</div>
          </div>
        </>
      )}
    </div>
  );
};