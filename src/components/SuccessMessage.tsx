import React, { useEffect, useState } from 'react';

interface SuccessMessageProps {
  message: string;
  duration?: number; // Duration in milliseconds before auto-hiding
  onClose?: () => void;
}

export default function SuccessMessage({ 
  message, 
  duration = 0, // 0 means don't auto-hide
  onClose 
}: SuccessMessageProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-md">
      <div className="flex items-start">
        <svg 
          className="w-5 h-5 mr-2 text-green-600 flex-shrink-0" 
          fill="currentColor" 
          viewBox="0 0 20 20" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            fillRule="evenodd" 
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
            clipRule="evenodd" 
          />
        </svg>
        <div className="flex-1">
          <p className="font-medium">Success</p>
          <p>{message}</p>
        </div>
        {onClose && (
          <button 
            onClick={() => {
              setVisible(false);
              onClose();
            }}
            className="ml-auto -mx-1.5 -my-1.5 bg-green-50 text-green-500 rounded-lg focus:ring-2 focus:ring-green-400 p-1.5 hover:bg-green-200 inline-flex h-8 w-8"
          >
            <span className="sr-only">Close</span>
            <svg 
              className="w-5 h-5" 
              fill="currentColor" 
              viewBox="0 0 20 20" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                fillRule="evenodd" 
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}