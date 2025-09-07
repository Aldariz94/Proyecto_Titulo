import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { Modal, CreateLoanForm, RenewLoanForm, ReturnLoanForm, Notification } from '../components';
import { useNotification } from '../hooks';
import { PlusIcon } from '@heroicons/react/24/outline';

const LoanManagementPage = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
    const [renewingLoanId, setRenewingLoanId] = useState(null);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [returningLoan, setReturningLoan] = useState(null);
    const { notification, showNotification } = useNotification();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const fetchLoans = useCallback(async (page, search, status) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page, limit: 10 });
            if (search) params.append('search', search);
            if (status) params.append('status', status);
            
            const response = await api.get(`/loans?${params.toString()}`);
            setLoans(response.data.docs);
            setTotalPages(response.data.totalPages);
            setCurrentPage(response.data.page);
        } catch (err) {
            showNotification('No se pudo cargar el historial de préstamos.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLoans(currentPage, searchTerm, statusFilter);
        }, 300);
        return () => clearTimeout(timer);
    }, [currentPage, searchTerm, statusFilter, fetchLoans]);

    const handleCreateLoan = async (loanData) => {
        try {
            await api.post('/loans', loanData);
            setIsCreateModalOpen(false);
            fetchLoans(1, searchTerm, statusFilter);
            showNotification('Préstamo creado exitosamente.');
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Error al crear el préstamo.', 'error');
        }
    };

    const handleRenewLoan = async (days) => {
        try {
            await api.put(`/loans/${renewingLoanId}/renew`, { days });
            setIsRenewModalOpen(false);
            setRenewingLoanId(null);
            fetchLoans(currentPage, searchTerm, statusFilter);
            showNotification('Préstamo renovado exitosamente.');
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Error al renovar el préstamo.', 'error');
        }
    };

    const handleReturnLoan = async (payload) => {
        if (!returningLoan) return;
        try {
            await api.post(`/loans/return/${returningLoan._id}`, payload);
            setIsReturnModalOpen(false);
            setReturningLoan(null);
            fetchLoans(currentPage, searchTerm, statusFilter);
            showNotification('Devolución procesada exitosamente.');
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Error al procesar la devolución.', 'error');
        }
    };

    const handleOpenRenewModal = (loanId) => {
        setRenewingLoanId(loanId);
        setIsRenewModalOpen(true);
    };

    const handleOpenReturnModal = (loan) => {
        setReturningLoan(loan);
        setIsReturnModalOpen(true);
    };

    return (
        <div>
            <Notification {...notification} />
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestión de Préstamos</h1>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <input 
                        type="text" 
                        placeholder="Buscar por usuario o ítem..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        className="w-full px-3 py-2 border rounded-md dark:bg-zinc-700 dark:border-zinc-600 dark:text-white" 
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
                    >
                        <option value="">Todos los Estados</option>
                        <option value="enCurso">En Préstamo</option>
                        <option value="devuelto">Devuelto</option>
                        <option value="atrasado">Atrasado</option>
                    </select>
                    <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 whitespace-nowrap">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Crear Préstamo
                    </button>
                </div>
            </div>

            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Crear Nuevo Préstamo">
                <CreateLoanForm onSubmit={handleCreateLoan} onCancel={() => setIsCreateModalOpen(false)} />
            </Modal>

            <Modal isOpen={isRenewModalOpen} onClose={() => setIsRenewModalOpen(false)} title="Renovar Préstamo">
                <RenewLoanForm onSubmit={handleRenewLoan} onCancel={() => setIsRenewModalOpen(false)} />
            </Modal>
            
            <Modal isOpen={isReturnModalOpen} onClose={() => setIsReturnModalOpen(false)} title="Procesar Devolución">
                <ReturnLoanForm onSubmit={handleReturnLoan} onCancel={() => setIsReturnModalOpen(false)} />
            </Modal>

            <h2 className="mt-10 text-2xl font-bold text-gray-800 dark:text-white">Historial de Préstamos</h2>
            <div className="mt-6 overflow-x-auto bg-white rounded-lg shadow dark:bg-zinc-800">
                {loading ? (
                    <div className="p-6 text-center dark:text-gray-300">Cargando préstamos...</div>
                ) : (
                    <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-zinc-700 responsive-table">
                        <thead className="bg-gray-50 dark:bg-zinc-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Ítem Prestado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Vencimiento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                            {loans.map(loan => (
                                <tr key={loan._id} className="hover:bg-gray-100 dark:hover:bg-zinc-600">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                                        {loan.usuarioId ? `${loan.usuarioId.primerNombre} ${loan.usuarioId.primerApellido}` : 'Usuario Eliminado'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-300">{loan.itemDetails?.titulo || loan.itemDetails?.nombre || 'Ítem Eliminado'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-300">{new Date(loan.fechaVencimiento).toLocaleDateString('es-CL')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                                            loan.estado === 'atrasado' ? 'bg-red-100 text-red-800' : 
                                            loan.estado === 'devuelto' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {loan.estado === 'enCurso' ? 'En Préstamo' : loan.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                                        {(loan.estado === 'enCurso' || loan.estado === 'atrasado') && (
                                            <button onClick={() => handleOpenReturnModal(loan)} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">Devolver</button>
                                        )}
                                        {loan.estado === 'enCurso' && (
                                            <button onClick={() => handleOpenRenewModal(loan._id)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">Renovar</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
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

export default LoanManagementPage;