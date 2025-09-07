import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
      <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-xl dark:bg-zinc-800 animate-scaleIn flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-3 border-b dark:border-zinc-700 flex-shrink-0">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 bg-transparent rounded-lg hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-zinc-600 dark:hover:text-white"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </button>
        </div>
        <div className="mt-4 overflow-y-auto pr-2">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;