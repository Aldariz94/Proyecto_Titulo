const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/login', async (req, res) => {
    const { correo, password } = req.body;

    if (typeof correo !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ msg: 'Datos de entrada no válidos.' });
    }

    try {
        const user = await User.findOne({ correo });
        if (!user) {
            return res.status(400).json({ msg: 'Credenciales inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, user.hashedPassword);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas.' });
        }
        
        const payload = {
            user: {
                id: user.id,
                rol: user.rol
            }
        };

        jwt.sign(
            payload, 
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if(err) throw err;
                res.json({ token });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

module.exports = router;
