const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Loan = require('../models/Loan');
const Reservation = require('../models/Reservation');
const Exemplar = require('../models/Exemplar');
const ResourceInstance = require('../models/ResourceInstance');

exports.createUser = async (req, res) => {
    const { primerNombre, primerApellido, rut, correo, password, rol, curso } = req.body;
    try {
        let user = await User.findOne({ $or: [{ correo }, { rut }] });
        if (user) {
            return res.status(400).json({ msg: 'El correo o RUT ya está registrado.' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password || rut, salt);

        user = new User({ ...req.body, hashedPassword });
        await user.save();
        res.status(201).json({ msg: 'Usuario creado exitosamente.', user });
    } catch (err) {
        console.error("Error al crear usuario:", err.message);
        res.status(500).send('Error del servidor');
    }
};

exports.getUsers = async (req, res) => {
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
                    { primerNombre: searchRegex }, { primerApellido: searchRegex },
                    { rut: searchRegex }, { correo: searchRegex }
                ]
            };
        }
        
        const totalUsers = await User.countDocuments(query);
        const totalPages = Math.ceil(totalUsers / limit);

        const users = await User.find(query)
            .select('-hashedPassword')
            .sort({ createdAt: -1, _id: 1 })
            .skip(skip)
            .limit(limit);
            
        res.json({
            docs: users,
            totalDocs: totalUsers,
            totalPages,
            page
        });
    } catch (err) {
        console.error("Error en getUsers:", err.message);
        res.status(500).send('Error del servidor');
    }
};

exports.updateUser = async (req, res) => {
    const { password, ...otherFields } = req.body;
    try {
        if (password) {
            const salt = await bcrypt.genSalt(10);
            otherFields.hashedPassword = await bcrypt.hash(password, salt);
        }
        const user = await User.findByIdAndUpdate(req.params.id, { $set: otherFields }, { new: true });
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado.' });
        }
        res.json({ msg: 'Usuario actualizado.', user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
};

exports.deleteUser = async (req, res) => {
    try {
        let user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado.' });
        }

        if (user.rol === 'admin') {
            return res.status(403).json({ msg: 'No se puede eliminar a otro administrador.' });
        }

        const activeLoans = await Loan.findOne({ 
            usuarioId: user._id, 
            estado: { $in: ['enCurso', 'atrasado'] } 
        });

        if (activeLoans) {
            return res.status(400).json({ msg: 'No se puede eliminar a este usuario porque tiene préstamos activos o atrasados.' });
        }
        
        const activeReservations = await Reservation.find({ 
            usuarioId: user._id,
            estado: 'pendiente'
        });

        if (activeReservations.length > 0) {
            for (const reservation of activeReservations) {
                const Model = reservation.itemModel === 'Exemplar' ? Exemplar : ResourceInstance;
                await Model.findByIdAndUpdate(reservation.item, { estado: 'disponible' });
            }
            await Reservation.deleteMany({ usuarioId: user._id, estado: 'pendiente' });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Usuario y sus reservas activas han sido eliminados exitosamente.' });

    } catch (err) {
        console.error("Error al eliminar usuario:", err.message);
        res.status(500).send('Error del servidor al intentar eliminar el usuario.');
    }
};

exports.getSanctionedUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';
        
        let query = { sancionHasta: { $gt: new Date() } };

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query = {
                $and: [
                    { sancionHasta: { $gt: new Date() } },
                    {
                        $or: [
                            { primerNombre: searchRegex },
                            { primerApellido: searchRegex },
                            { rut: searchRegex }
                        ]
                    }
                ]
            };
        }

        const total = await User.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        const users = await User.find(query)
            .select('primerNombre primerApellido rut sancionHasta')
            .skip(skip)
            .limit(limit);

        res.json({ docs: users, totalDocs: total, totalPages, page });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
};

exports.removeSanction = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { $set: { sancionHasta: null } });
        res.json({ msg: 'Sanción eliminada.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-hashedPassword');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
};