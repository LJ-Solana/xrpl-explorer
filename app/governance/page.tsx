"use client";

import React, { useEffect, useState } from 'react';
import { LedgerProgressProvider, useLedgerProgress } from '../context/LedgerProgressContext';

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
        // Fetch validator list (UNL) - placeholder, as 'validators' command may not be available on all nodes
        // You can use 'server_info' or 'validator_list_sites' for more governance data
        // For now, show a placeholder
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
    <div className="min-h-screen flex flex-col font-sans bg-black text-gray-100" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-md z-0" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <main className="container mx-auto p-6 flex-1">
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
        </main>
      </div>
    </div>
  );
};

export default function GovernancePageWrapper() {
  return (
    <LedgerProgressProvider>
      <GovernancePage />
    </LedgerProgressProvider>
  );
} 