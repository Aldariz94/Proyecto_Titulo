import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import StatusBadge from './StatusBadge';

const DetailRow = ({ label, value }) => (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{value || 'No especificado'}</dd>
    </div>
);

const ResourceDetails = ({ resource }) => {
    const [instances, setInstances] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchInstances = useCallback(async () => {
        if (resource) {
            setLoading(true);
            try {
                const res = await api.get(`/resources/${resource._id}/instances`);
                setInstances(res.data);
            } finally {
                setLoading(false);
            }
        }
    }, [resource]);

    useEffect(() => {
        fetchInstances();
    }, [fetchInstances]);

    if (!resource) return null;

    return (
        <div>
            <dl>
                <DetailRow label="Nombre" value={resource.nombre} />
                <DetailRow label="Sede" value={resource.sede} />
                <DetailRow label="Categoría" value={resource.categoria} />
                <DetailRow label="Ubicación" value={resource.ubicacion} />
                <DetailRow label="Descripción" value={resource.descripcion} />
            </dl>
            <h4 className="mt-6 mb-2 font-bold dark:text-white">Instancias</h4>
            {loading ? <p className="dark:text-gray-400">Cargando instancias...</p> : (
                <div className="max-h-60 overflow-y-auto pr-2">
                    {instances.map(inst => (
                        <div key={inst._id} className="flex items-center justify-between py-2 border-b dark:border-zinc-700">
                            <span className="dark:text-gray-300">{inst.codigoInterno}</span>
                            <StatusBadge status={inst.estado} />
                        </div>
                    ))}
                    {instances.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No hay instancias registradas.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ResourceDetails;