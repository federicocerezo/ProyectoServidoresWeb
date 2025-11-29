const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    users: [{ type: String }],
    votes: { type: Map, of: Number, default: {} },
    status: { type: String, default: 'lobby' }, //
    createdAt: { type: Date, default: Date.now, expires: 3600 }
});

module.exports = mongoose.model('Room', RoomSchema);
