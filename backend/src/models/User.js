const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, 
    history: [{
        name: String,
        date: { type: Date, default: Date.now }
    }],
    // CORRECCIÓN: Array de strings simple para los IDs
    favorites: [String] 
});

module.exports = mongoose.model('User', UserSchema);
