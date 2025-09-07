const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookSchema = new Schema({

    tipoDocumento: { type: String, required: true },
    titulo: { type: String, required: true, index: true },
    autor: { type: String, required: true, index: true },
    lugarPublicacion: { type: String, required: true },
    editorial: { type: String, required: true },
    sede: { 
        type: String,
        required: [true, 'La sede es un campo obligatorio.'],
        enum: ['Media', 'Básica']
    },

    pais: { type: String, default: 'Chile' },
    numeroPaginas: { type: Number },
    descriptores: [String],
    idioma: { type: String },
    isbn: { type: String, unique: true, sparse: true },
    cdd: { type: String },
    añoPublicacion: { type: Number },
    edicion: { type: String },
    ubicacionEstanteria: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);