"use client";

import React from 'react';

interface DetailItemProps {
  label: string;
  value: string;
  isHashLink?: boolean;
  href?: string;
  icon?: React.ReactNode;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, isHashLink = false, href = '#', icon }) => {
  return (
    <div className="py-3 border-b border-gray-800 last:border-b-0 flex flex-col sm:flex-row sm:items-center gap-2">
      <dt className="text-sm font-medium text-gray-400 w-full sm:w-1/4 flex items-center gap-2">
        {icon && <span className="text-purple-400">{icon}</span>}
        {label}
      </dt>
      <dd className="text-sm text-white w-full sm:w-3/4 break-words">
        {isHashLink ? (
          <a 
            href={href} 
            className="text-blue-400 hover:text-purple-400 hover:underline transition-colors duration-200"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
};

export default DetailItem; 