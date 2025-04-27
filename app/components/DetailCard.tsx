"use client";

import React from 'react';

interface DetailCardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const DetailCard: React.FC<DetailCardProps> = ({ title, children, icon }) => {
  return (
    <div className="bg-gradient-to-br from-white/10 to-purple-100/5 backdrop-blur-lg border border-purple-100/60 rounded-2xl shadow-md mb-6">
      <div className="px-6 py-4 border-b border-purple-100/40 flex items-center gap-3 bg-white/5">
        {icon && <div className="text-purple-200">{icon}</div>}
        <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default DetailCard; 