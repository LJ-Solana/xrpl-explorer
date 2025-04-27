"use client";

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-900 rounded-xl">
      <div className={`animate-spin rounded-full border-t-2 border-b-2 border-purple-500 ${sizeClasses[size]}`}></div>
      {text && <p className="mt-4 text-white text-sm">{text}</p>}
    </div>
  );
};

export default LoadingSpinner; 