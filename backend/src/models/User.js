const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // En producción esto debe ir hasheado (bcrypt)
    history: [{
        name: String,
        date: { type: Date, default: Date.now }
    }],
    favorites: [{ type: String }] // IDs de restaurantes favoritos
});

module.exports = mongoose.model('User', UserSchema);