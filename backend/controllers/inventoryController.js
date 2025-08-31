const mongoose = require('mongoose');
const Book = require('../models/Book');
const ResourceCRA = require('../models/ResourceCRA');
const Exemplar = require('../models/Exemplar');
const ResourceInstance = require('../models/ResourceInstance');
const Loan = require('../models/Loan');

exports.getItemsForAttention = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const problemStatus = ['deteriorado', 'extraviado', 'mantenimiento'];

        const exemplars = await Exemplar.find({ estado: { $in: problemStatus } }).populate('libroId', 'titulo').lean();
        const resourceInstances = await ResourceInstance.find({ estado: { $in: problemStatus } }).populate('resourceId', 'nombre').lean();

        const formattedExemplars = exemplars.map(e => ({ ...e, itemType: 'Libro' }));
        const formattedInstances = resourceInstances.map(i => ({ ...i, itemType: 'Recurso' }));

        const allItems = [...formattedExemplars, ...formattedInstances]
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)); // Ordenar por fecha de actualización

        const totalItems = allItems.length;
        const totalPages = Math.ceil(totalItems / limit);

        const paginatedItems = allItems.slice(skip, skip + limit);

        res.json({
            docs: paginatedItems,
            totalDocs: totalItems,
            totalPages,
            page
        });
    } catch (err) {
        console.error("Error al obtener ítems para atención:", err.message);
        res.status(500).send('Error del servidor');
    }
};


// --- FUNCIÓN "DAR DE BAJA" CON LÓGICA MEJORADA ---
exports.deleteItemInstance = async (req, res) => {
    try {
        const { itemModel, itemId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({ msg: 'ID de ítem no válido.' });
        }

        const Model = itemModel === 'Libro' ? Exemplar : ResourceInstance;
        const item = await Model.findById(itemId);

        if (!item) {
            return res.status(404).json({ msg: 'Instancia o ejemplar no encontrado.' });
        }

        if (['prestado', 'reservado'].includes(item.estado)) {
             return res.status(400).json({ msg: 'No se puede dar de baja un ítem que está en préstamo o reservado.' });
        }
        
        const activeLoan = await Loan.findOne({ item: itemId, estado: { $in: ['enCurso', 'atrasado'] } });
        if(activeLoan) {
            return res.status(400).json({ msg: 'Este ítem está asociado a un préstamo activo. Primero debe ser devuelto.' });
        }

        // --- INICIO DE LA NUEVA LÓGICA ---
        if (itemModel === 'Libro') {
            const count = await Exemplar.countDocuments({ libroId: item.libroId });
            // Si es la última copia, borramos también el libro principal.
            if (count <= 1) {
                await Book.findByIdAndDelete(item.libroId);
            }
        } else { // Si es Recurso
            const count = await ResourceInstance.countDocuments({ resourceId: item.resourceId });
            // Si es la última copia, borramos también el recurso principal.
            if (count <= 1) {
                await ResourceCRA.findByIdAndDelete(item.resourceId);
            }
        }

        // Finalmente, borramos el ejemplar o instancia.
        await Model.findByIdAndDelete(itemId);
        // --- FIN DE LA NUEVA LÓGICA ---

        res.json({ msg: 'Ítem dado de baja exitosamente.' });
    } catch (err) {
        console.error("Error al dar de baja el ítem:", err.message);
        res.status(500).send('Error del servidor');
    }
};