import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { TrashIcon } from '@heroicons/react/24/outline';
import StatusBadge from './StatusBadge';
import { useNotification } from '../hooks';
import { Notification } from './';

const ResourceForm = ({ onSubmit, onCancel, initialData, onUpdateSuccess }) => {
    const [resourceData, setResourceData] = useState({
        nombre: '', categoria: 'tecnologia',
        descripcion: '', ubicacion: '', sede: 'Media',
    });
    const [cantidadInstancias, setCantidadInstancias] = useState(1);
    const [additionalInstances, setAdditionalInstances] = useState(0);
    const isEditing = !!initialData;

    const [instances, setInstances] = useState([]);
    const [instancesToDelete, setInstancesToDelete] = useState([]);
    const { notification, showNotification } = useNotification();

    const fetchInstances = useCallback(async () => {
        if (isEditing) {
            try {
                const res = await api.get(`/resources/${initialData._id}/instances`);
                setInstances(res.data);
            } catch (error) {
                showNotification('No se pudieron cargar las instancias.', 'error');
            }
        }
    }, [isEditing, initialData, showNotification]);

    useEffect(() => {
        if (isEditing) {
            setResourceData({
                nombre: initialData.nombre || '',
                categoria: initialData.categoria || 'tecnologia',
                descripcion: initialData.descripcion || '',
                ubicacion: initialData.ubicacion || '',
                sede: initialData.sede || 'Media',
            });
            fetchInstances();
        }
    }, [initialData, isEditing, fetchInstances]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setResourceData(prev => ({ ...prev, [name]: value }));
    };

    const handleDeleteClick = (instanceId) => {
        setInstancesToDelete([...instancesToDelete, instanceId]);
        setInstances(instances.filter(inst => inst._id !== instanceId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = isEditing 
            ? { resourceData, additionalInstances, instancesToDelete } 
            : { resourceData, cantidadInstancias };
        
        const success = await onSubmit(payload);

        if (success) {
            onUpdateSuccess();
        }
    };

    const inputClass = "w-full px-3 py-2 border rounded-md dark:bg-zinc-700 dark:border-zinc-600 dark:text-white";
    const labelClass = "block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300";

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
            <Notification {...notification} />
            <div>
                <label className={labelClass}>Nombre del Recurso (Obligatorio)</label>
                <input name="nombre" value={resourceData.nombre} onChange={handleChange} placeholder="Proyector Epson" required className={inputClass} />
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className={labelClass}>Categoría (Obligatorio)</label>
                    <select name="categoria" value={resourceData.categoria} onChange={handleChange} required className={inputClass}>
                        <option value="tecnologia">Tecnología</option>
                        <option value="juego">Juego Didáctico</option>
                        <option value="pedagogico">Material Pedagógico</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Sede (Obligatorio)</label>
                    <select name="sede" value={resourceData.sede} onChange={handleChange} required className={inputClass}>
                        <option value="Media">Sede Media</option>
                        <option value="Básica">Sede Básica</option>
                    </select>
                </div>
            </div>
            <div>
                <label className={labelClass}>Ubicación (Opcional)</label>
                <input name="ubicacion" value={resourceData.ubicacion} onChange={handleChange} placeholder="Bodega CRA" className={inputClass} />
            </div>
            <div>
                <label className={labelClass}>Descripción (Opcional)</label>
                <textarea name="descripcion" value={resourceData.descripcion} onChange={handleChange} placeholder="Proyector para salas de clases" className={inputClass + " h-24"} />
            </div>

            {isEditing && (
                <div className="mt-6 pt-4 border-t dark:border-zinc-700">
                    <h4 className="mb-2 font-bold dark:text-white">Gestionar Instancias Existentes</h4>
                    <div className="max-h-40 overflow-y-auto pr-2 space-y-2">
                        {instances.map(inst => (
                            <div key={inst._id} className="flex items-center justify-between p-2 rounded bg-gray-100 dark:bg-zinc-700">
                                <span className="dark:text-gray-300">{inst.codigoInterno}</span>
                                <div className="flex items-center gap-4">
                                    <StatusBadge status={inst.estado} />
                                    {inst.estado !== 'prestado' && inst.estado !== 'reservado' && (
                                        <button type="button" onClick={() => handleDeleteClick(inst._id)} className="text-red-500 hover:text-red-700" title="Marcar para Eliminar">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {instances.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No quedan instancias para gestionar.</p>}
                    </div>
                </div>
            )}

            {isEditing && (
                 <div>
                    <label className={labelClass}>Añadir más Instancias</label>
                    <input type="number" value={additionalInstances} onChange={(e) => setAdditionalInstances(Number(e.target.value))} min="0" className={inputClass} />
                </div>
            )}
            
            {!isEditing && (
                <div>
                    <label className={labelClass}>Cantidad de Instancias a Crear (Obligatorio)</label>
                    <input type="number" value={cantidadInstancias} onChange={(e) => setCantidadInstancias(Number(e.target.value))} min="1" required className={inputClass} />
                </div>
            )}

            <div className="flex justify-end pt-4 space-x-2">
                <button type="button" onClick={onCancel} className="px-4 py-2 font-medium text-gray-600 bg-gray-200 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Guardar</button>
            </div>
        </form>
    );
};

export default ResourceForm;