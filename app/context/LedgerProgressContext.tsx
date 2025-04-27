"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Client } from 'xrpl';

const XRPL_API = 'https://s.altnet.rippletest.net:51234';
const FIXED_INTERVAL = 3.5; // seconds

interface LedgerData {
  ledger_index: number;
  total_coins: string;
  close_time: number;
}

interface ViewState {
  type: 'home' | 'account' | 'tx' | 'ledger';
  identifier: string | null;
}

interface LedgerProgressContextType {
  ledgerIndex: number | null;
  lastCloseTime: number | null;
  interval: number;
  progress: number;
  timeLeft: string;
  loading: boolean;
  error: string | null;
  recentLedgers: LedgerData[];
  recentLedgersLoading: boolean;
  recentLedgersError: string | null;
  client: Client | null;
  isConnected: boolean;
  connectionError: string | null;
  view: ViewState;
  setView: (view: ViewState) => void;
  handleSearch: (term: string) => void;
}

const LedgerProgressContext = createContext<LedgerProgressContextType | undefined>(undefined);

export const LedgerProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ledgerIndex, setLedgerIndex] = useState<number | null>(null);
  const [lastCloseTime, setLastCloseTime] = useState<number | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentLedgers, setRecentLedgers] = useState<LedgerData[]>([]);
  const [recentLedgersLoading, setRecentLedgersLoading] = useState(true);
  const [recentLedgersError, setRecentLedgersError] = useState<string | null>(null);
  const clientRef = useRef<Client | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>({ type: 'home', identifier: null });

  const interval = FIXED_INTERVAL;

  // Navigation and search logic
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (!hash || hash === '/') {
        setView({ type: 'home', identifier: null });
        return;
      }
      const parts = hash.split('/');
      if (parts.length === 2) {
        const [type, identifier] = parts;
        if (type === 'account' && identifier.startsWith('r') && identifier.length > 25) {
          setView({ type, identifier }); return;
        } else if (type === 'tx' && identifier.length === 64 && /^[A-Fa-f0-9]+$/.test(identifier)) {
          setView({ type, identifier }); return;
        } else if (type === 'ledger' && (/^[0-9]+$/.test(identifier) || (identifier.length === 64 && /^[A-Fa-f0-9]+$/.test(identifier)))) {
          setView({ type, identifier }); return;
        }
      }
      setView({ type: 'home', identifier: null });
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSearch = (term: string) => {
    if (term.startsWith('r') && term.length > 25) {
      window.location.hash = `#account/${term}`;
    } else if (term.length === 64 && /^[A-Fa-f0-9]+$/.test(term)) {
      window.location.hash = `#tx/${term}`;
    } else if (/^[0-9]+$/.test(term)) {
      window.location.hash = `#ledger/${term}`;
    } else {
      alert('Invalid search term. Please enter a valid Account Address (starts with r), Transaction Hash (64 hex chars), or Ledger Index (number).');
    }
  };

  // Connect client only once
  useEffect(() => {
    let isMounted = true;
    const connectClient = async () => {
      if (!clientRef.current) {
        const newClient = new Client('wss://s.altnet.rippletest.net:51233');
        try {
          await newClient.connect();
          clientRef.current = newClient;
          if (!isMounted) return;
          setIsConnected(true);
          setConnectionError(null);
          setLoading(true);
          const res = await newClient.request({ command: 'ledger', ledger_index: 'validated' });
          if (res.result && res.result.ledger) {
            setLedgerIndex(Number(res.result.ledger.ledger_index));
            setLastCloseTime(Number(res.result.ledger.close_time));
          }
          setLoading(false);
        } catch (err) {
          setError('Failed to connect to XRPL network.');
          setConnectionError('Failed to connect to XRPL network.');
          setIsConnected(false);
          setLoading(false);
        }
      }
    };
    connectClient();
    return () => {
      isMounted = false;
      if (clientRef.current && clientRef.current.isConnected()) {
        clientRef.current.disconnect();
      }
      setIsConnected(false);
    };
  }, []);

  // Register WebSocket event handler only once
  useEffect(() => {
    const client = clientRef.current;
    if (!client || !client.isConnected()) return;
    const handleLedgerClosed = async (ledger: LedgerData) => {
      setLedgerIndex(Number(ledger.ledger_index));
      setLastCloseTime(Number(ledger.close_time));
      setRecentLedgersLoading(true);
      setRecentLedgersError(null);
      try {
        const promises = [];
        for (let i = 0; i < 5; i++) {
          promises.push(
            client.request({ command: 'ledger', ledger_index: Number(ledger.ledger_index) - i })
              .then(d => d.result && d.result.ledger ? d.result.ledger : null)
          );
        }
        const ledgersData = (await Promise.all(promises)).filter(Boolean);
        setRecentLedgers(ledgersData.map((l: any) => ({
          ledger_index: l.ledger_index,
          total_coins: l.total_coins,
          close_time: l.close_time,
        })));
        if (ledgersData.length === 0) {
          setRecentLedgersError('No ledgers found.');
        }
      } catch (e) {
        setRecentLedgersError('Failed to fetch ledgers.');
        setRecentLedgers([]);
      } finally {
        setRecentLedgersLoading(false);
      }
    };
    client.on('ledgerClosed', handleLedgerClosed);
    return () => {
      client.off('ledgerClosed', handleLedgerClosed);
    };
  }, [clientRef.current]);

  // Progress bar effect
  useEffect(() => {
    if (!lastCloseTime) return;
    if (timerRef.current) clearInterval(timerRef.current);
    let startTime = Date.now();
    setProgress(0);
    setTimeLeft(`in ~${Math.round(interval)}s`);
    const update = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      let prog = Math.min(elapsed / interval, 1);
      setProgress(prog);
      const left = Math.max(0, interval - elapsed);
      setTimeLeft(`in ~${left.toFixed(1)}s`);
      if (prog >= 1) {
        setProgress(1);
      }
    };
    update();
    timerRef.current = setInterval(update, 50);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lastCloseTime]);

  return (
    <LedgerProgressContext.Provider value={{
      ledgerIndex,
      lastCloseTime,
      interval,
      progress,
      timeLeft,
      loading,
      error,
      recentLedgers,
      recentLedgersLoading,
      recentLedgersError,
      client: clientRef.current,
      isConnected,
      connectionError,
      view,
      setView,
      handleSearch,
    }}>
      {children}
    </LedgerProgressContext.Provider>
  );
};

export function useLedgerProgress() {
  const ctx = useContext(LedgerProgressContext);
  if (!ctx) throw new Error('useLedgerProgress must be used within a LedgerProgressProvider');
  return ctx;
} 