"use client";

import React from 'react';

interface StatusBarProps {
  isConnected: boolean;
  connectionError: string | null;
  latestLedgerIndex: number | null;
}

const StatusBar: React.FC<StatusBarProps> = ({ isConnected, connectionError, latestLedgerIndex }) => {
  return (
    <div className="bg-gray-900 rounded-lg shadow-md p-4 mb-6 border border-gray-800">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : connectionError ? 'bg-red-500' : 'bg-yellow-500'}`} />
          <span className="text-sm font-medium text-white">
            {isConnected ? 'Connected' : connectionError ? 'Connection Error' : 'Connecting...'}
          </span>
        </div>
        
        {latestLedgerIndex && isConnected && (
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-white">Latest Ledger: {latestLedgerIndex}</span>
          </div>
        )}
      </div>
      
      {connectionError && (
        <div className="mt-3 text-sm text-red-400 bg-gray-800 p-3 rounded-lg">
          {connectionError}
        </div>
      )}
    </div>
  );
};

export default StatusBar; 