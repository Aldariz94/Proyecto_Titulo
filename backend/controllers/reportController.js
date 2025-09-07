const Loan = require('../models/Loan');
const User = require('../models/User');
const Book = require('../models/Book');
const mongoose = require('mongoose');
const Exemplar = require('../models/Exemplar');
const ResourceInstance = require('../models/ResourceInstance');

exports.generateLoanReport = async (req, res) => {
    try {
        const { startDate, endDate, status, course, bookId, userId, includeOrphaned = 'true' } = req.query;
        let { role } = req.query;
        
        const isExport = req.query.export === 'true';

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const skip = (page - 1) * limit;

        if (req.user.rol === 'profesor') {
            if (role && role !== 'alumno' && role !== 'profesor') {
                return res.status(403).json({ msg: 'No tiene permisos para generar reportes sobre este rol.' });
            }
        }

        let query = {};
        let userQuery = {};

        if (bookId && mongoose.Types.ObjectId.isValid(bookId)) {
            const exemplars = await Exemplar.find({ libroId: bookId }).select('_id');
            const exemplarIds = exemplars.map(ex => ex._id);
            if (exemplarIds.length > 0) {
                query.item = { $in: exemplarIds };
                query.itemModel = 'Exemplar';
            } else {
                return res.json({ docs: [], totalPages: 0, page: 1, totalDocs: 0 });
            }
        }
        
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setUTCHours(23, 59, 59, 999);
            query.fechaInicio = { $gte: start, $lte: end };
        }
        
        if (status) query.estado = status;

        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            userQuery = { _id: userId };
        } else {
            if (req.user.rol === 'profesor') {
                if (role === 'profesor') {
                    userQuery._id = req.user.id;
                } else {
                    userQuery.rol = 'alumno';
                    if (course) userQuery.curso = course;
                }
            } else if (req.user.rol === 'admin') {
                if (role) userQuery.rol = role;
                if (course) {
                    userQuery.curso = course;
                    userQuery.rol = 'alumno';
                }
            }
        }
        
        if (Object.keys(userQuery).length > 0) {
            const users = await User.find(userQuery).select('_id');
            const userIds = users.map(user => user._id);
            if (userIds.length === 0) return res.json({ docs: [], totalPages: 0, page: 1, totalDocs: 0 });
            query.usuarioId = { $in: userIds };
        }

        const totalDocs = await Loan.countDocuments(query);
        const totalPages = Math.ceil(totalDocs / limit);

        let loansQuery = Loan.find(query)
            .populate('usuarioId', 'primerNombre primerApellido rut curso rol')
            .sort({ fechaInicio: -1, _id: 1 });

        if (!isExport) {
            loansQuery = loansQuery.skip(skip).limit(limit);
        }

        const loans = await loansQuery.lean();

        let formattedLoans = await Promise.all(loans.map(async (loan) => {
            let itemDetails = { titulo: 'Ítem Eliminado', nombre: 'Ítem Eliminado' };
            if (loan.itemModel === 'Exemplar') {
                const exemplar = await Exemplar.findById(loan.item).populate('libroId', 'titulo');
                if (exemplar && exemplar.libroId) {
                    itemDetails = { titulo: `${exemplar.libroId.titulo} (Copia #${exemplar.numeroCopia})` };
                }
            } else if (loan.itemModel === 'ResourceInstance') {
                const instance = await ResourceInstance.findById(loan.item).populate('resourceId', 'nombre');
                if (instance && instance.resourceId) {
                    itemDetails = { nombre: `${instance.resourceId.nombre} (${instance.codigoInterno})` };
                }
            }
            return { ...loan, itemDetails };
        }));

        if (includeOrphaned === 'false') {
            formattedLoans = formattedLoans.filter(loan => {
                const isUserOrphan = !loan.usuarioId;
                const isItemOrphan = loan.itemDetails?.titulo === 'Ítem Eliminado' || loan.itemDetails?.nombre === 'Ítem Eliminado';
                return !isUserOrphan && !isItemOrphan;
            });
        }
        
        res.json({
            docs: formattedLoans,
            totalDocs,
            totalPages,
            page
        });

    } catch (err) {
        console.error("Error al generar el reporte:", err.message);
        res.status(500).send('Error del servidor');
    }
};