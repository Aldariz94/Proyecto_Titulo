import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import StatusBadge from './StatusBadge';

const DetailRow = ({ label, value }) => (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{value || 'No especificado'}</dd>
    </div>
);

const BookDetails = ({ book, onUpdate }) => {
    const [exemplars, setExemplars] = useState([]);
    const [loading, setLoading] = useState(false);


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

    if (!book) return null;

    return (
        <div>
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
                            <StatusBadge status={ex.estado} />
                        </div>
                    ))}
                    {exemplars.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No hay ejemplares registrados.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default BookDetails;