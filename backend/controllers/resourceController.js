const ResourceCRA = require('../models/ResourceCRA');
const ResourceInstance = require('../models/ResourceInstance');
const mongoose = require('mongoose');
const Loan = require('../models/Loan');

exports.createResource = async (req, res) => {
    const { resourceData, cantidadInstancias } = req.body;
    
    try {
        const newResource = new ResourceCRA(resourceData);
        const savedResource = await newResource.save();

        if (cantidadInstancias > 0) {
            const sedePrefix = savedResource.sede === 'Básica' ? 'RBB' : 'RBM';
            
            const lastInstance = await ResourceInstance.findOne({
                codigoInterno: { $regex: `^${sedePrefix}` }
            }).sort({ codigoInterno: -1 });

            let nextNumericPart = 1;
            if (lastInstance && lastInstance.codigoInterno) {
                const lastNumericPart = parseInt(lastInstance.codigoInterno.split('-')[1]);
                if (!isNaN(lastNumericPart)) {
                    nextNumericPart = lastNumericPart + 1;
                }
            }
            
            const instances = [];
            for (let i = 0; i < cantidadInstancias; i++) {
                const sequentialNumber = (nextNumericPart + i).toString().padStart(3, '0');
                instances.push({
                    resourceId: savedResource._id,
                    codigoInterno: `${sedePrefix}-${sequentialNumber}`,
                    estado: 'disponible'
                });
            }
            await ResourceInstance.insertMany(instances);
        }
        res.status(201).json({ msg: 'Recurso e instancias creados.', resource: savedResource });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
};

exports.getResources = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        let query = {};
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query = {
                $or: [
                    { nombre: searchRegex },
                    { sede: searchRegex },
                    { categoria: searchRegex }
                ]
            };
        }
        
        const results = await ResourceCRA.aggregate([
            { $match: query },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $sort: { createdAt: -1, _id: 1 } },
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: 'resourceinstances',
                                localField: '_id',
                                foreignField: 'resourceId',
                                as: 'instancesInfo'
                            }
                        },
                        {
                            $addFields: {
                                totalInstances: { $size: '$instancesInfo' },
                                availableInstances: {
                                    $size: {
                                        $filter: {
                                            input: '$instancesInfo',
                                            as: 'instance',
                                            cond: { $eq: ['$$instance.estado', 'disponible'] }
                                        }
                                    }
                                }
                            }
                        },
                        { $project: { instancesInfo: 0 } }
                    ]
                }
            }
        ]);
        
        const resources = results[0].data;
        const totalResources = results[0].metadata[0] ? results[0].metadata[0].total : 0;
        const totalPages = Math.ceil(totalResources / limit);

        res.json({
            docs: resources,
            totalDocs: totalResources,
            totalPages,
            page
        });
    } catch (err) {
        console.error("Error en getResources:", err.message);
        res.status(500).send('Error del servidor');
    }
};

exports.updateResource = async (req, res) => {
    const { resourceData, additionalInstances, instancesToDelete } = req.body;
    const { id: resourceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        return res.status(400).json({ msg: 'ID de recurso no válido.' });
    }

    try {
        if (instancesToDelete && instancesToDelete.length > 0) {
            const currentInstanceCount = await ResourceInstance.countDocuments({ resourceId: resourceId });
            if (instancesToDelete.length >= currentInstanceCount) {
                return res.status(400).json({ 
                    msg: 'No se puede eliminar la última instancia. Utilice la opción "Dar de Baja" para eliminar el recurso completo.' 
                });
            }
        }

        const resource = await ResourceCRA.findByIdAndUpdate(resourceId, { $set: resourceData }, { new: true });
        if (!resource) {
            return res.status(404).json({ msg: 'Recurso no encontrado.' });
        }

        if (instancesToDelete && instancesToDelete.length > 0) {
            await ResourceInstance.deleteMany({
                _id: { $in: instancesToDelete },
                estado: { $nin: ['prestado', 'reservado'] }
            });
        }
        
        if (additionalInstances > 0) {
            const sedePrefix = resource.sede === 'Básica' ? 'RBB' : 'RBM';
            
            const lastInstance = await ResourceInstance.findOne({ codigoInterno: { $regex: `^${sedePrefix}` } }).sort({ codigoInterno: -1 });
            
            let nextNumericPart = 1;
            if (lastInstance && lastInstance.codigoInterno) {
                const lastNumericPart = parseInt(lastInstance.codigoInterno.split('-')[1]);
                if (!isNaN(lastNumericPart)) {
                    nextNumericPart = lastNumericPart + 1;
                }
            }

            const newInstances = [];
            for (let i = 0; i < additionalInstances; i++) {
                const sequentialNumber = (nextNumericPart + i).toString().padStart(3, '0');
                newInstances.push({
                    resourceId: resourceId,
                    codigoInterno: `${sedePrefix}-${sequentialNumber}`,
                    estado: 'disponible'
                });
            }
            await ResourceInstance.insertMany(newInstances);
        }

        res.json({ msg: 'Recurso actualizado exitosamente.', resource });
    } catch (err) {
        console.error("Error al actualizar el recurso:", err.message);
        res.status(500).send('Error del servidor');
    }
};

exports.deleteResource = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'ID de recurso no válido.' });
    }
    try {
        const resource = await ResourceCRA.findById(req.params.id);
        if (!resource) return res.status(404).json({ msg: 'Recurso no encontrado.' });
        await ResourceInstance.deleteMany({ resourceId: req.params.id });
        await ResourceCRA.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Recurso y todas sus instancias han sido eliminados.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
};


exports.addInstances = async (req, res) => {
    const { id: resourceId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        return res.status(400).json({ msg: 'ID de recurso no válido.' });
    }
    if (!quantity || quantity < 1) {
        return res.status(400).json({ msg: 'Cantidad no válida.' });
    }

    try {
        const resource = await ResourceCRA.findById(resourceId);
        if (!resource) {
            return res.status(404).json({ msg: 'Recurso no encontrado.' });
        }

        const sedePrefix = resource.sede === 'Básica' ? 'RBB' : 'RBM';

    
        const lastInstance = await ResourceInstance.findOne({
            codigoInterno: { $regex: `^${sedePrefix}` }
        }).sort({ codigoInterno: -1 });

        let nextNumericPart = 1;
        if (lastInstance) {
            const lastNumericPart = parseInt(lastInstance.codigoInterno.split('-')[1]);
            nextNumericPart = lastNumericPart + 1;
        }

        const newInstances = [];
        for (let i = 0; i < quantity; i++) {
            const sequentialNumber = (nextNumericPart + i).toString().padStart(3, '0');
            const codigoInterno = `${sedePrefix}-${sequentialNumber}`;
            
            newInstances.push({
                resourceId: resourceId,
                codigoInterno: codigoInterno,
                estado: 'disponible'
            });
        }

        await ResourceInstance.insertMany(newInstances);
        res.status(201).json({ msg: `${quantity} nuevas instancias añadidas.` });

    } catch (err) {
        console.error("Error al añadir instancias:", err.message);
        res.status(500).send('Error del servidor');
    }
};

exports.deleteInstance = async (req, res) => {
    const { instanceId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(instanceId)) {
        return res.status(400).json({ msg: 'ID de instancia no válido.' });
    }

    try {
        const instance = await ResourceInstance.findById(instanceId);
        if (!instance) {
            return res.status(404).json({ msg: 'Instancia no encontrada.' });
        }

        if (['prestado', 'reservado'].includes(instance.estado)) {
            return res.status(400).json({ msg: 'No se puede eliminar una instancia que está actualmente en préstamo o reservada.' });
        }

        const count = await ResourceInstance.countDocuments({ resourceId: instance.resourceId });

        if (count <= 1) {
            return res.status(400).json({ 
                msg: 'No se puede eliminar la última instancia. Si deseas retirar el recurso del catálogo, debes usar la opción "Dar de Baja" en la página de Gestión de Recursos.' 
            });
        }

        await ResourceInstance.findByIdAndDelete(instanceId);

        res.json({ msg: 'Instancia eliminada exitosamente.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
};

exports.getInstancesForResource = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'ID de recurso no válido.' });
    }
    try {
        const instances = await ResourceInstance.find({ resourceId: req.params.id }).sort({ codigoInterno: 'asc' });
        res.json(instances);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
};

exports.updateInstanceStatus = async (req, res) => {
    const { estado } = req.body;
    const { instanceId } = req.params;

    const allowedStatus = ['disponible', 'prestado', 'mantenimiento', 'reservado'];
    if (!estado || !allowedStatus.includes(estado)) {
        return res.status(400).json({ msg: 'Estado no válido.' });
    }
    if (!mongoose.Types.ObjectId.isValid(instanceId)) {
        return res.status(400).json({ msg: 'ID de instancia no válido.' });
    }

    try {
        const instance = await ResourceInstance.findByIdAndUpdate(
            instanceId,
            { $set: { estado } },
            { new: true }
        );
        if (!instance) return res.status(404).json({ msg: 'Instancia no encontrada.' });
        res.json(instance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
};