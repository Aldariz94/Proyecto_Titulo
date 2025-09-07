import React from 'react';

const StatusBadge = ({ status }) => {
    const statusStyles = {
        disponible: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        prestado: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        reservado: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
        deteriorado: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        extraviado: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        mantenimiento: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    };

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
        </span>
    );
};

export default StatusBadge;