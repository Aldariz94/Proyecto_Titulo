// backend/controllers/dashboardController.js
const Loan = require('../models/Loan');
const Reservation = require('../models/Reservation');
const User = require('../models/User');
const Exemplar = require('../models/Exemplar');
const ResourceInstance = require('../models/ResourceInstance'); // Se agrega la importación que faltaba

exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));

        const overdueLoansQuery = {
            estado: 'enCurso',
            fechaVencimiento: { $lt: today }
        };

        // --- INICIO DE LA CORRECCIÓN ---

        const [
            loansToday,
            reservationsToday,
            overdueLoans,
            sanctionedUsers,
            problemExemplars,  // 1. Contamos los ejemplares con problemas
            problemInstances   // 2. Contamos las instancias con problemas
        ] = await Promise.all([
            Loan.countDocuments({ fechaInicio: { $gte: startOfDay } }),
            Reservation.countDocuments({ fechaReserva: { $gte: startOfDay } }),
            Loan.countDocuments(overdueLoansQuery),
            User.countDocuments({ sancionHasta: { $gt: new Date() } }),
            Exemplar.countDocuments({ estado: { $in: ['deteriorado', 'extraviado'] } }),
            // Se añade la consulta para contar los recursos en mantenimiento
            ResourceInstance.countDocuments({ estado: 'mantenimiento' })
        ]);

        // 3. Sumamos ambos resultados para obtener el total real
        const itemsForAttention = problemExemplars + problemInstances;

        res.json({
            loansToday,
            reservationsToday,
            overdueLoans,
            sanctionedUsers,
            itemsForAttention // 4. Enviamos el total combinado
        });
        
        // --- FIN DE LA CORRECCIÓN ---

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
};