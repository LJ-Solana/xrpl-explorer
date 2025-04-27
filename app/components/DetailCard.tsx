"use client";

import React from 'react';

interface DetailCardProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const DetailCard: React.FC<DetailCardProps> = ({ title, children, icon }) => {
  return (
    <div className="bg-white/10 backdrop-blur-md border-2 border-purple-100 rounded-xl overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-purple-100 flex items-center gap-2">
        {icon && <div className="text-purple-100">{icon}</div>}
        <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default DetailCard; 