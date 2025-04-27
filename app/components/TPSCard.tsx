"use client";

import React, { useState, useEffect } from 'react';
import DetailCard from './DetailCard';
import { Client } from 'xrpl';

const TPSCard: React.FC = () => {
  const [tps, setTps] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    const connectClient = async () => {
      const newClient = new Client('wss://s.altnet.rippletest.net:51233');
      try {
        await newClient.connect();
        setClient(newClient);
      } catch (err) {
        setError('Failed to connect to XRPL network.');
      }
    };

    connectClient();
    return () => {
      if (client?.isConnected()) {
        client.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (!client || !client.isConnected()) return;

    let transactionCount = 0;
    const startTime = Date.now();

    const handleTransaction = () => {
      transactionCount++;
      const elapsedTime = (Date.now() - startTime) / 1000; // Convert to seconds
      const currentTps = transactionCount / elapsedTime;
      setTps(currentTps);
    };

    client.on('transaction', handleTransaction);

    return () => {
      client.off('transaction', handleTransaction);
    };
  }, [client]);

  return (
    <DetailCard
      title="True TPS"
      icon={
        <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      }
    >
      <div className="flex flex-col items-center justify-center h-24">
        {error ? (
          <span className="text-red-500">{error}</span>
        ) : tps === null ? (
          <span className="text-3xl font-bold text-white">Loading</span>
        ) : (
          <>
            <span className="text-3xl font-bold text-white">{tps.toFixed(2)}</span>
            <span className="text-sm text-gray-400">tx/s</span>
          </>
        )}
      </div>
    </DetailCard>
  );
};

export default TPSCard; 