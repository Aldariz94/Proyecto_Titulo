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

        // Obtener usuarios y ítems disponibles
        const alumnos = await User.find({ rol: 'alumno' });
        const profesores = await User.find({ rol: 'profesor' });
        const personal = await User.find({ rol: 'personal' });
        
        // --- LÍNEA CORREGIDA ---
        let availableExemplars = await Exemplar.find({ estado: 'disponible' }).limit(500);
        let availableInstances = await ResourceInstance.find({ estado: 'disponible' }).limit(50);

        const loansToCreate = [];

        // --- Escenario 1: Préstamos Devueltos ---
        console.log('🔄 Generando historial de préstamos devueltos...');
        for (let i = 0; i < 200; i++) { // Cantidad aumentada
            if (availableExemplars.length === 0) break;
            const user = alumnos[i % alumnos.length];
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

        // --- Escenario 2: Préstamos Actualmente Atrasados ---
        console.log('🔄 Generando préstamos actualmente atrasados...');
        for (let i = 0; i < 15; i++) { // Cantidad aumentada
            if (availableExemplars.length === 0) break;
            const user = alumnos[i % alumnos.length];
            const exemplar = availableExemplars.pop();
            
            const fechaInicio = realisticDaysAgo(15, 25);
            const fechaVencimiento = addBusinessDays(fechaInicio, 10);

            loansToCreate.push({
                usuarioId: user._id, item: exemplar._id, itemModel: 'Exemplar',
                fechaInicio, fechaVencimiento, estado: 'enCurso'
            });
            await Exemplar.findByIdAndUpdate(exemplar._id, { estado: 'prestado' });
        }
        
        // --- Escenario 3: Préstamos en Curso (sin atraso) ---
        console.log('🔄 Generando préstamos en curso...');
        for (let i = 0; i < 40; i++) { // Cantidad aumentada
            if (availableExemplars.length === 0) break;
            const user = profesores[i % profesores.length];
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
        if(availableExemplars.length >= 6) {
            await Exemplar.findByIdAndUpdate(availableExemplars.pop()._id, { estado: 'deteriorado' });
            await Exemplar.findByIdAndUpdate(availableExemplars.pop()._id, { estado: 'extraviado' });
            await Exemplar.findByIdAndUpdate(availableExemplars.pop()._id, { estado: 'deteriorado' });
            await Exemplar.findByIdAndUpdate(availableExemplars.pop()._id, { estado: 'extraviado' });
            await Exemplar.findByIdAndUpdate(availableExemplars.pop()._id, { estado: 'deteriorado' });
            await Exemplar.findByIdAndUpdate(availableExemplars.pop()._id, { estado: 'extraviado' });
        }
        if(availableInstances.length >= 3) {
            await ResourceInstance.findByIdAndUpdate(availableInstances.pop()._id, { estado: 'mantenimiento' });
            await ResourceInstance.findByIdAndUpdate(availableInstances.pop()._id, { estado: 'mantenimiento' });
            await ResourceInstance.findByIdAndUpdate(availableInstances.pop()._id, { estado: 'mantenimiento' });
        }
        console.log('✅ Ítems para mantenimiento generados.');
        
        // --- Escenario 5: Reservas Activas ---
        console.log('🔄 Generando reservas activas...');
        for (let i = 0; i < 10; i++) { // Cantidad aumentada
            if (availableExemplars.length === 0) break;
            const user = personal[i % personal.length];
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