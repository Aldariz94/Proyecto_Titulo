import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import StatusBadge from './StatusBadge';
import { Modal } from './';
import { TrashIcon } from '@heroicons/react/24/outline';

const DetailRow = ({ label, value }) => (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{value || 'No especificado'}</dd>
    </div>
);

const BookDetails = ({ book, onUpdate }) => {
    const [exemplars, setExemplars] = useState([]);
    const [loading, setLoading] = useState(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [exemplarToDelete, setExemplarToDelete] = useState(null);

    const fetchExemplars = useCallback(async () => {
        if (book) {
            setLoading(true);
            try {
                const res = await api.get(`/books/${book._id}/exemplars`);
                setExemplars(res.data);
            } catch (error) {
                console.error("Error al cargar ejemplares", error);
            } finally {
                setLoading(false);
            }
        }
    }, [book]);

    useEffect(() => {
        fetchExemplars();
    }, [fetchExemplars]);

    const handleDeleteClick = (exemplar) => {
        setExemplarToDelete(exemplar);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!exemplarToDelete) return;
        try {
            await api.delete(`/books/exemplars/${exemplarToDelete._id}`);
            setIsDeleteModalOpen(false);
            setExemplarToDelete(null);
            await fetchExemplars();
            if (onUpdate) onUpdate();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error al eliminar el ejemplar.');
            setIsDeleteModalOpen(false);
        }
    };

    if (!book) return null;

    return (
        <div>
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Eliminación">
                <div className="space-y-4">
                    <p className="dark:text-gray-300">
                        ¿Estás seguro de que deseas eliminar la <strong className="dark:text-white">Copia N° {exemplarToDelete?.numeroCopia}</strong> de este libro?
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">Esta acción no se puede deshacer.</p>
                    <div className="flex justify-end pt-4 space-x-2">
                        <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 font-medium text-gray-600 bg-gray-200 rounded-md dark:bg-zinc-600 dark:text-zinc-300">Cancelar</button>
                        <button type="button" onClick={executeDelete} className="px-4 py-2 font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Sí, Eliminar</button>
                    </div>
                </div>
            </Modal>

            <dl>
                <DetailRow label="Título" value={book.titulo} />
                <DetailRow label="Autor" value={book.autor} />
                <DetailRow label="Editorial" value={book.editorial} />
                <DetailRow label="Sede" value={book.sede} />
                <DetailRow label="Lugar de Publicación" value={book.lugarPublicacion} />
                <DetailRow label="Año de Publicación" value={book.añoPublicacion} />
                <DetailRow label="Tipo de Documento" value={book.tipoDocumento} />
                <DetailRow label="ISBN" value={book.isbn} />
                <DetailRow label="Edición" value={book.edicion} />
                <DetailRow label="N° de Páginas" value={book.numeroPaginas} />
                <DetailRow label="Idioma" value={book.idioma} />
                <DetailRow label="País" value={book.pais} />
                <DetailRow label="CDD" value={book.cdd} />
                <DetailRow label="Ubicación en Estantería" value={book.ubicacionEstanteria} />
                <DetailRow label="Descriptores" value={(book.descriptores || []).join(', ')} />
            </dl>
            <h4 className="mt-6 mb-2 font-bold dark:text-white">Ejemplares</h4>
            {loading ? <p className="dark:text-gray-400">Cargando ejemplares...</p> : (
                <div className="max-h-60 overflow-y-auto pr-2">
                    {exemplars.map(ex => (
                        <div key={ex._id} className="flex items-center justify-between py-2 border-b dark:border-zinc-700">
                            <span className="dark:text-gray-300">Copia N° {ex.numeroCopia}</span>
                            <div className="flex items-center gap-4">
                                <StatusBadge status={ex.estado} />
                                {ex.estado !== 'prestado' && ex.estado !== 'reservado' && (
                                    <button onClick={() => handleDeleteClick(ex)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" title="Eliminar Ejemplar">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                     {exemplars.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No hay ejemplares registrados para este libro.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default BookDetails;