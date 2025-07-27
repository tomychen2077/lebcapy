import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
      <div className="flex items-start">
        <svg 
          className="w-5 h-5 mr-2 text-red-600 flex-shrink-0" 
          fill="currentColor" 
          viewBox="0 0 20 20" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            fillRule="evenodd" 
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
            clipRule="evenodd" 
          />
        </svg>
        <div>
          <p className="font-medium">Error</p>
          <p>{message}</p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="mt-2 text-sm font-medium text-red-700 underline hover:text-red-800"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}