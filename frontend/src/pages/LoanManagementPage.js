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

    // --- INICIO DE LA CORRECCIÓN ---

    // 1. Añadimos estados para la búsqueda con "debounce"
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    // 2. Modificamos fetchLoans para que acepte el término de búsqueda
    const fetchLoans = useCallback(async (page, search) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page, limit: 10 });
            if (search) {
                params.append('search', search); // Se añade el parámetro de búsqueda
            }
            // La API de préstamos necesita ser actualizada para aceptar 'search'
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

    // 3. Añadimos el efecto de "debounce" para no sobrecargar la API
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== debouncedSearchTerm) {
                setCurrentPage(1); // Reiniciar a la página 1 en una nueva búsqueda
                setDebouncedSearchTerm(searchTerm);
            }
        }, 500); // Espera 500ms después de que el usuario deja de escribir
        return () => clearTimeout(timer);
    }, [searchTerm, debouncedSearchTerm]);


    // 4. Actualizamos el efecto principal para que reaccione a los cambios de búsqueda
    useEffect(() => {
        fetchLoans(currentPage, debouncedSearchTerm);
    }, [currentPage, debouncedSearchTerm, fetchLoans]);

    // 5. Eliminamos el 'useMemo' para el filtrado en el cliente. Ya no es necesario.
    
    // --- FIN DE LA CORRECCIÓN ---

    const handleCreateLoan = async (loanData) => {
        try {
            await api.post('/loans', loanData);
            setIsCreateModalOpen(false);
            fetchLoans(1, debouncedSearchTerm); // Refrescar desde la página 1 con el filtro actual
            showNotification('Préstamo creado exitosamente.');
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Error al crear el préstamo.', 'error');
        }
    };

    const handleOpenRenewModal = (loanId) => {
        setRenewingLoanId(loanId);
        setIsRenewModalOpen(true);
    };

    const handleRenewLoan = async (days) => {
        try {
            await api.put(`/loans/${renewingLoanId}/renew`, { days });
            setIsRenewModalOpen(false);
            setRenewingLoanId(null);
            fetchLoans(currentPage, debouncedSearchTerm);
            showNotification('Préstamo renovado exitosamente.');
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Error al renovar el préstamo.', 'error');
        }
    };

    const handleOpenReturnModal = (loan) => {
        setReturningLoan(loan);
        setIsReturnModalOpen(true);
    };

    const handleReturnLoan = async (payload) => {
        if (!returningLoan) return;
        try {
            await api.post(`/loans/return/${returningLoan._id}`, payload);
            setIsReturnModalOpen(false);
            setReturningLoan(null);
            fetchLoans(currentPage, debouncedSearchTerm);
            showNotification('Devolución procesada exitosamente.');
        } catch (err) {
            showNotification(err.response?.data?.msg || 'Error al procesar la devolución.', 'error');
        }
    };

    return (
        <div>
            <Notification {...notification} />
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestión de Préstamos</h1>
                <div className="flex items-center gap-4">
                    <input type="text" placeholder="Buscar por usuario, ítem, estado..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-64 px-3 py-2 border rounded-md dark:bg-zinc-700 dark:border-zinc-600 dark:text-white" />
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
                            {/* Se renderiza directamente el estado 'loans' */}
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