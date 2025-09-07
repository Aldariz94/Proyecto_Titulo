const User = require('../models/User');
const Exemplar = require('../models/Exemplar');
const ResourceInstance = require('../models/ResourceInstance');
const Book = require('../models/Book');
const ResourceCRA = require('../models/ResourceCRA');

exports.searchUsers = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.json([]);
        }
        const users = await User.find({
            $or: [
                { primerNombre: { $regex: query, $options: 'i' } },
                { primerApellido: { $regex: query, $options: 'i' } },
                { rut: { $regex: query, $options: 'i' } },
                { correo: { $regex: query, $options: 'i' } }
            ]
        }).select('primerNombre primerApellido rut').limit(10);
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
};

exports.searchAvailableItems = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.length < 2) {
            return res.json([]);
        }

        const searchRegex = new RegExp(query, 'i');

        const [matchingBooks, matchingResources] = await Promise.all([
            Book.find({ titulo: searchRegex }).limit(10).lean(),
            ResourceCRA.find({ nombre: searchRegex }).limit(10).lean()
        ]);

        const bookIds = matchingBooks.map(b => b._id);
        const resourceIds = matchingResources.map(r => r._id);

        const [availableExemplars, availableInstances] = await Promise.all([
            bookIds.length > 0 ? Exemplar.find({ libroId: { $in: bookIds }, estado: 'disponible' }).populate('libroId', 'titulo') : Promise.resolve([]),
            resourceIds.length > 0 ? ResourceInstance.find({ resourceId: { $in: resourceIds }, estado: 'disponible' }).populate('resourceId', 'nombre') : Promise.resolve([])
        ]);

        const bookResults = availableExemplars.map(e => ({
            _id: e._id,
            type: 'Exemplar',
            name: `${e.libroId.titulo} (Copia #${e.numeroCopia})`
        }));
        
        const resourceResults = availableInstances.map(i => ({
            _id: i._id,
            type: 'ResourceInstance',
            name: `${i.resourceId.nombre} (${i.codigoInterno})`
        }));
        
        res.json([...bookResults, ...resourceResults].slice(0, 15));

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
};

exports.searchAllBooks = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.json([]);
        }
        const books = await Book.find({
            titulo: { $regex: query, $options: 'i' }
        }).select('titulo autor').limit(10);
        res.json(books);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
};

exports.findAvailableCopy = async (req, res) => {
    try {
        const { itemType, baseItemId } = req.params;

        let availableCopy = null;

        if (itemType === 'Book') {
            availableCopy = await Exemplar.findOne({
                libroId: baseItemId,
                estado: 'disponible'
            });
        } else if (itemType === 'Resource') {
            availableCopy = await ResourceInstance.findOne({
                resourceId: baseItemId,
                estado: 'disponible'
            });
        }

        if (!availableCopy) {
            return res.status(404).json({ msg: 'No se encontraron copias disponibles para este ítem.' });
        }

        res.json({ copyId: availableCopy._id });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
};

exports.searchStudents = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.json([]);
        }
        const students = await User.find({
            rol: 'alumno',
            $or: [
                { primerNombre: { $regex: query, $options: 'i' } },
                { primerApellido: { $regex: query, $options: 'i' } },
                { rut: { $regex: query, $options: 'i' } }
            ]
        }).select('primerNombre primerApellido rut').limit(10);
        res.json(students);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
};
