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
        const search = req.query.search || '';
        const status = req.query.status || '';
        const type = req.query.type || ''; // <-- 1. Captura el nuevo filtro de TIPO

        let problemStatus = ['deteriorado', 'extraviado', 'mantenimiento'];
        if (status) {
            problemStatus = [status];
        }

        let exemplars = [];
        let resourceInstances = [];

        // 2. Lógica condicional basada en el filtro de TIPO
        if (type !== 'Recurso') { // Busca libros si el tipo es 'Libro' o si no se ha especificado tipo
            let exemplarQuery = { estado: { $in: problemStatus.filter(s => s !== 'mantenimiento') } };
            if (search) {
                const searchRegex = new RegExp(search, 'i');
                const matchingBooks = await Book.find({ titulo: searchRegex }).select('_id');
                exemplarQuery.libroId = { $in: matchingBooks.map(b => b._id) };
            }
            exemplars = await Exemplar.find(exemplarQuery).populate('libroId', 'titulo').lean();
        }

        if (type !== 'Libro') { // Busca recursos si el tipo es 'Recurso' o si no se ha especificado tipo
            let resourceQuery = { estado: { $in: problemStatus.filter(s => s === 'mantenimiento') } };
            if (search) {
                const searchRegex = new RegExp(search, 'i');
                // 3. Se elimina la búsqueda por 'codigoInterno'
                const matchingResources = await ResourceCRA.find({ nombre: searchRegex }).select('_id');
                resourceQuery.resourceId = { $in: matchingResources.map(r => r._id) };
            }
            resourceInstances = await ResourceInstance.find(resourceQuery).populate('resourceId', 'nombre').lean();
        }

        const formattedExemplars = exemplars.map(e => ({ ...e, itemType: 'Libro' }));
        const formattedInstances = resourceInstances.map(i => ({ ...i, itemType: 'Recurso' }));

        const allItems = [...formattedExemplars, ...formattedInstances]
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

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