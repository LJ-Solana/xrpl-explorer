"use client";

import React from 'react';

interface HeaderProps {
  activeTab: 'explorer' | 'governance';
  onTabChange: (tab: 'explorer' | 'governance') => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => (
  <header className="bg-gray-900 border-b border-gray-800 shadow-lg rounded-t-xl">
    <div className="container mx-auto flex flex-col md:flex-row items-center justify-between py-6 px-4">
      <div className="flex items-center gap-3">
        <svg className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /></svg>
        <span className="text-2xl font-bold tracking-tight text-white">Beacon</span>
      </div>
      <div className="flex items-center gap-6 mt-4 md:mt-0">
        <nav className="flex gap-4 text-sm">
          <button
            onClick={() => onTabChange('explorer')}
            className={`hover:text-purple-400 transition ${activeTab === 'explorer' ? 'text-purple-400 font-bold' : ''}`}
          >
            Explorer
          </button>
          <button
            onClick={() => onTabChange('governance')}
            className={`hover:text-purple-400 transition ${activeTab === 'governance' ? 'text-purple-400 font-bold' : ''}`}
          >
            Governance
          </button>
        </nav>
        <button className="ml-4 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold shadow">Sign In</button>
      </div>
    </div>
  </header>
);

export default Header; 