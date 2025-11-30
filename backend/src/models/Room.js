const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    users: [{ type: String }],
    usersDone: [{ type: String }],
    votes: { type: Map, of: Number, default: {} },
    status: { type: String, default: 'lobby' },
    filters: {
        type: { type: String, default: 'Any' },
        price: { type: String, default: 'Any' },
        // --- CAMBIO AQUÍ: Añadimos el campo limit ---
        limit: { type: Number, default: 20 }
    },
    allowedIds: [{ type: Number }],
    createdAt: { type: Date, default: Date.now, expires: 3600 }
});

module.exports = mongoose.model('Room', RoomSchema);