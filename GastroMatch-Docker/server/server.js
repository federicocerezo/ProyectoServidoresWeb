require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Configuración DB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Conectado');
    } catch (err) { console.error('Error Mongo:', err); }
};
connectDB();

// App
const app = express();
app.use(cors());
app.use(express.json());

// Rutas e Importaciones
const Room = require('./models/room');

// --- RUTAS API (Simplificadas en el mismo archivo para facilitar) ---

// Crear Sala
app.post('/api/create-room', async (req, res) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newRoom = new Room({ code, users: [req.body.username] });
    await newRoom.save();
    res.json({ success: true, roomCode: code, room: newRoom });
});

// Unirse Sala
app.post('/api/join-room', async (req, res) => {
    const { code, username } = req.body;
    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ error: 'Sala no existe' });
    if (!room.users.includes(username)) {
        room.users.push(username);
        await room.save();
    }
    res.json({ success: true, room });
});

// Votar
app.post('/api/vote', async (req, res) => {
    const { code, restaurantId } = req.body;
    const room = await Room.findOne({ code });
    if(room) {
        const current = room.votes.get(String(restaurantId)) || 0;
        room.votes.set(String(restaurantId), current + 1);
        await room.save();
        res.json({ success: true });
    }
});

// Estado Sala (Polling)
app.get('/api/room/:code', async (req, res) => {
    const room = await Room.findOne({ code: req.params.code });
    res.json(room);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server corriendo en puerto ${PORT}`));