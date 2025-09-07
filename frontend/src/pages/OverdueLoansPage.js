import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useNotification } from '../hooks';
import { Notification } from '../components';

const OverdueLoansPage = () => {
    const [overdueLoans, setOverdueLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const { notification, showNotification } = useNotification();

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const fetchOverdueLoans = useCallback(async (page, search) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page, limit: 10 });
            if (search) {
                params.append('search', search);
            }
            const response = await api.get(`/loans/overdue?${params.toString()}`);
            setOverdueLoans(response.data.docs);
            setTotalPages(response.data.totalPages);
            setCurrentPage(response.data.page);
        } catch (err) {
            showNotification('No se pudo cargar la lista de préstamos atrasados.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== debouncedSearchTerm) {
                setCurrentPage(1);
                setDebouncedSearchTerm(searchTerm);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, debouncedSearchTerm]);

    useEffect(() => {
        fetchOverdueLoans(currentPage, debouncedSearchTerm);
    }, [currentPage, debouncedSearchTerm, fetchOverdueLoans]);
    
    const calculateOverdueDays = (dueDate) => {
        const diff = new Date() - new Date(dueDate);
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <div>
            <Notification {...notification} />
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Préstamos Atrasados</h1>
                <input 
                    type="text" 
                    placeholder="Buscar por usuario o ítem..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full md:w-64 px-3 py-2 border rounded-md dark:bg-zinc-700 dark:border-zinc-600 dark:text-white" 
                />
            </div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
                Esta lista muestra todos los préstamos que no han sido devueltos y su fecha de vencimiento ya pasó.
            </p>

            <div className="mt-6 overflow-x-auto bg-white rounded-lg shadow dark:bg-zinc-800">
                {loading ? (
                    <div className="p-6 text-center dark:text-gray-300">Cargando préstamos...</div>
                ) : (
                    <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-zinc-700 responsive-table">
                        <thead className="bg-gray-50 dark:bg-zinc-700">
                            <tr>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase dark:text-gray-300">Usuario</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase dark:text-gray-300">Ítem</th>
                                <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase dark:text-gray-300">Fecha Vencimiento</th>
                                <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase dark:text-gray-300">Días de Atraso</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                            {overdueLoans.length > 0 ? (
                                overdueLoans.map(loan => (
                                    <tr key={loan._id} className="hover:bg-gray-100 dark:hover:bg-zinc-600">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">{loan.usuarioId ? `${loan.usuarioId.primerNombre} ${loan.usuarioId.primerApellido}` : 'Usuario Eliminado'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-300">{loan.itemDetails?.titulo || loan.itemDetails?.nombre || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-red-500 dark:text-red-400 font-semibold">{new Date(loan.fechaVencimiento).toLocaleDateString('es-CL')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-red-500 dark:text-red-400 font-bold text-center">{calculateOverdueDays(loan.fechaVencimiento)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                        ¡Excelente! No hay préstamos atrasados que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-end mt-4 text-sm">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 mr-2 text-gray-700 bg-gray-200 rounded-md dark:bg-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Anterior
                    </button>
                    <span className="text-gray-700 dark:text-zinc-300">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 ml-2 text-gray-700 bg-gray-200 rounded-md dark:bg-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Siguiente
                    </button>
                </div>
            )}
        </div>
    );
};

export default OverdueLoansPage;