const Loan = require('../models/Loan');
const Reservation = require('../models/Reservation');
const User = require('../models/User');
const Exemplar = require('../models/Exemplar');
const ResourceInstance = require('../models/ResourceInstance');

exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));

        const overdueLoansQuery = {
            estado: 'enCurso',
            fechaVencimiento: { $lt: today }
        };

        const [
            loansToday,
            reservationsToday,
            overdueLoans,
            sanctionedUsers,
            problemExemplars,
            problemInstances   
        ] = await Promise.all([
            Loan.countDocuments({ fechaInicio: { $gte: startOfDay } }),
            Reservation.countDocuments({ fechaReserva: { $gte: startOfDay } }),
            Loan.countDocuments(overdueLoansQuery),
            User.countDocuments({ sancionHasta: { $gt: new Date() } }),
            Exemplar.countDocuments({ estado: { $in: ['deteriorado', 'extraviado'] } }),
            ResourceInstance.countDocuments({ estado: 'mantenimiento' })
        ]);

        const itemsForAttention = problemExemplars + problemInstances;

        res.json({
            loansToday,
            reservationsToday,
            overdueLoans,
            sanctionedUsers,
            itemsForAttention
        });
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
};