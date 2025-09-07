// backend/seed_transactions.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Exemplar = require('./models/Exemplar');
const ResourceInstance = require('./models/ResourceInstance');
const Loan = require('./models/Loan');
const Reservation = require('./models/Reservation');
const { addBusinessDays } = require('./utils/dateUtils');

dotenv.config();

// Función para barajar un arreglo aleatoriamente
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const realisticDaysAgo = (min, max) => {
    const days = Math.floor(Math.random() * (max - min + 1) + min);
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
};

const populateTransactions = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB conectado para el script de seeding.');

        // Limpieza General
        await Loan.deleteMany({});
        await Reservation.deleteMany({});
        await User.updateMany({}, { $set: { sancionHasta: null } });
        await Exemplar.updateMany({}, { $set: { estado: 'disponible' } });
        await ResourceInstance.updateMany({}, { $set: { estado: 'disponible' } });
        console.log('🧹 Datos de transacciones anteriores limpiados.');

        // Obtener usuarios e ítems
        let allAlumnos = await User.find({ rol: 'alumno' });
        let profesores = await User.find({ rol: 'profesor' });
        let personal = await User.find({ rol: 'personal' });
        let availableExemplars = await Exemplar.find({ estado: 'disponible' }).limit(500);
        let availableInstances = await ResourceInstance.find({ estado: 'disponible' }).limit(50);

        // Barajar todas las listas
        console.log('🔀 Barajando usuarios e ítems...');
        allAlumnos = shuffleArray(allAlumnos);
        profesores = shuffleArray(profesores);
        personal = shuffleArray(personal);
        availableExemplars = shuffleArray(availableExemplars);
        availableInstances = shuffleArray(availableInstances);

        // --- INICIO DE LA CORRECCIÓN CLAVE ---
        // Reservamos un grupo de alumnos específicamente para los préstamos atrasados.
        const ALUMNOS_PARA_ATRASOS_COUNT = 15;
        if (allAlumnos.length < ALUMNOS_PARA_ATRASOS_COUNT) {
            console.warn(`⚠️ No hay suficientes alumnos (${allAlumnos.length}) para crear la cantidad deseada de préstamos atrasados (${ALUMNOS_PARA_ATRASOS_COUNT}). Se crearán los que sean posibles.`);
        }
        const alumnosParaAtrasos = allAlumnos.splice(0, ALUMNOS_PARA_ATRASOS_COUNT);
        // 'allAlumnos' ahora contiene el resto de los alumnos para las otras operaciones.
        // --- FIN DE LA CORRECCIÓN CLAVE ---

        const loansToCreate = [];

        // --- Escenario 1: Préstamos Actualmente Atrasados (AHORA SE EJECUTA PRIMERO) ---
        console.log('🔄 Generando préstamos actualmente atrasados...');
        for (const user of alumnosParaAtrasos) {
            if (availableExemplars.length === 0) break;
            const exemplar = availableExemplars.pop();
            
            const fechaInicio = realisticDaysAgo(15, 25);
            const fechaVencimiento = addBusinessDays(fechaInicio, 10);

            loansToCreate.push({
                usuarioId: user._id, item: exemplar._id, itemModel: 'Exemplar',
                fechaInicio, fechaVencimiento, estado: 'enCurso'
            });
            await Exemplar.findByIdAndUpdate(exemplar._id, { estado: 'prestado' });
        }

        // --- Escenario 2: Préstamos Devueltos ---
        console.log('🔄 Generando historial de préstamos devueltos...');
        // Usamos el resto de los alumnos que quedaron en 'allAlumnos'
        for (let i = 0; i < 200; i++) {
            if (availableExemplars.length === 0 || allAlumnos.length === 0) break;
            const user = allAlumnos.pop();
            const exemplar = availableExemplars.pop();
            
            const fechaInicio = realisticDaysAgo(20, 120);
            const fechaVencimiento = addBusinessDays(fechaInicio, 10);
            const devueltoConAtraso = Math.random() > 0.7;
            const diasDeAtraso = devueltoConAtraso ? Math.floor(Math.random() * 5) + 1 : -2;
            const fechaDevolucion = addBusinessDays(fechaVencimiento, diasDeAtraso);

            loansToCreate.push({
                usuarioId: user._id, item: exemplar._id, itemModel: 'Exemplar',
                fechaInicio, fechaVencimiento, fechaDevolucion, estado: 'devuelto'
            });

            if (devueltoConAtraso) {
                const sancionHasta = new Date(fechaDevolucion);
                sancionHasta.setDate(sancionHasta.getDate() + diasDeAtraso);
                await User.findByIdAndUpdate(user._id, { $set: { sancionHasta } });
            }
        }
        
        // --- Escenario 3: Préstamos en Curso (sin atraso) ---
        console.log('🔄 Generando préstamos en curso...');
        for (let i = 0; i < 40; i++) {
            if (availableExemplars.length === 0 || profesores.length === 0) break;
            const user = profesores.pop();
            const exemplar = availableExemplars.pop();

            const fechaInicio = realisticDaysAgo(1, 8);
            const fechaVencimiento = addBusinessDays(fechaInicio, 10);

            loansToCreate.push({
                usuarioId: user._id, item: exemplar._id, itemModel: 'Exemplar',
                fechaInicio, fechaVencimiento, estado: 'enCurso'
            });
            await Exemplar.findByIdAndUpdate(exemplar._id, { estado: 'prestado' });
        }
        await Loan.insertMany(loansToCreate);
        console.log(`✅ ${loansToCreate.length} préstamos históricos y activos creados.`);

        // --- Escenario 4: Ítems para Mantenimiento ---
        console.log('🔄 Poniendo ítems en mantenimiento...');
        for (let i = 0; i < 6; i++) {
            if (availableExemplars.length === 0) break;
            const estado = i % 2 === 0 ? 'deteriorado' : 'extraviado';
            await Exemplar.findByIdAndUpdate(availableExemplars.pop()._id, { estado });
        }
        for (let i = 0; i < 3; i++) {
            if (availableInstances.length === 0) break;
            await ResourceInstance.findByIdAndUpdate(availableInstances.pop()._id, { estado: 'mantenimiento' });
        }
        console.log('✅ Ítems para mantenimiento generados.');
        
        // --- Escenario 5: Reservas Activas ---
        console.log('🔄 Generando reservas activas...');
        for (let i = 0; i < 10; i++) {
            if (availableExemplars.length === 0 || personal.length === 0) break;
            const user = personal.pop();
            const exemplar = availableExemplars.pop();

            await Reservation.create({
                usuarioId: user._id, item: exemplar._id, itemModel: 'Exemplar',
                expiraEn: addBusinessDays(new Date(), 2), estado: 'pendiente'
            });
            await Exemplar.findByIdAndUpdate(exemplar._id, { estado: 'reservado' });
        }
        console.log('✅ Reservas activas creadas.');

    } catch (error) {
        console.error('❌ Error durante el proceso de seeding:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB.');
    }
};

populateTransactions();