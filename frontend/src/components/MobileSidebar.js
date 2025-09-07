import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

const MobileSidebar = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex" aria-modal="true" role="dialog">
            <div 
                className="absolute inset-0 bg-black bg-opacity-50" 
                onClick={onClose}
                aria-hidden="true"
            ></div>
            
            <div className="relative h-full">
                {children}
            </div>

            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white rounded-full p-1 hover:bg-white/20 transition-colors"
                aria-label="Cerrar menú"
            >
                <XMarkIcon className="w-8 h-8" />
            </button>
        </div>
    );
};

export default MobileSidebar;