const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    // CORRECCIÓN: Usar [String] para un array simple de textos.
    // La sintaxis anterior [{ type: String }] creaba objetos y rompía la lógica de usuarios.
    users: [String],
    
    // CORRECCIÓN: Igual para usersDone
    usersDone: [String],
    
    votes: { type: Map, of: Number, default: {} },
    status: { type: String, default: 'lobby' },
    filters: {
        type: { type: String, default: 'Any' },
        price: { type: String, default: 'Any' },
        limit: { type: Number, default: 20 }
    },
    // CORRECCIÓN: Usar [Number] para array de números
    allowedIds: [Number],
    
    createdAt: { type: Date, default: Date.now, expires: 3600 }
});

module.exports = mongoose.model('Room', RoomSchema);