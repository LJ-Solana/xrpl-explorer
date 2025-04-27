"use client";

import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Account Address, Tx Hash, or Ledger Index"
            className="w-full px-6 py-4 text-lg rounded-xl border border-purple-600 bg-gray-900 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm transition-all duration-200 placeholder-gray-400"
          />
          <button
            type="submit"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            Search
          </button>
        </div>
      </form>
      <div className="mt-2 text-sm text-gray-400 text-center">
        <p>Enter an XRPL account address (starts with r), transaction hash, or ledger index</p>
      </div>
    </div>
  );
};

export default SearchBar; 