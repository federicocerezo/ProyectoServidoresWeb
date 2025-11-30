const Room = require("../models/Room");

exports.createRoom = async (req, res) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Recibimos filtros del body (si existen)
    const filters = req.body.filters || { type: 'Any', price: 'Any' };
    const allowedIds = req.body.allowedIds || [];
    
    const newRoom = new Room({
        code,
        users: [req.body.username],
        filters: filters // Guardamos los filtros
    });

    await newRoom.save();

    res.json({ success: true, roomCode: code, room: newRoom });
};

exports.joinRoom = async (req, res) => {
    const { code, username } = req.body;
    // Usamos findOne para comprobar estado antes de actualizar
    let room = await Room.findOne({ code });

    if (!room) return res.status(404).json({ error: "Sala no existe" });
    
    // 1. BLOQUEAR ENTRADA SI YA EMPEZÓ
    if (room.status !== 'lobby') {
        return res.json({ success: false, error: "La votación ya ha comenzado" });
    }

    // Si todo está bien, añadimos al usuario (usando la lógica atómica que vimos antes)
    room = await Room.findOneAndUpdate(
        { code },
        { $addToSet: { users: username } },
        { new: true }
    );

    res.json({ success: true, room });
};
exports.vote = async (req, res) => {
    const { code, restaurantId } = req.body;
    const voteField = `votes.${restaurantId}`;

    const room = await Room.findOneAndUpdate(
        { code },
        { $inc: { [voteField]: 1 } }, // Incrementa en 1 atómicamente
        { new: true }
    );

    if (!room) return res.status(404).json({ error: "Sala no existe" });

    res.json({ success: true });
};

// backend/src/controllers/roomController.js

// NUEVO: Marcar usuario como finalizado
exports.finishVoting = async (req, res) => {
    const { code, username } = req.body;
    await Room.findOneAndUpdate(
        { code },
        { $addToSet: { usersDone: username } }
    );
    res.json({ success: true });
};

// MODIFICADO: Detectar Fin de Juego (No Match)
exports.getRoom = async (req, res) => {
    const room = await Room.findOne({ code: req.params.code });
    if (!room) return res.status(404).json({ error: "Sala no encontrada" });

    const matches = [];
    const totalUsers = room.users.length;
    
    // Calcular matches
    if (room.votes) {
        for (const [restId, count] of room.votes) {
            if (count >= totalUsers && totalUsers > 0) {
                matches.push(Number(restId));
            }
        }
    }

    // Calcular si el juego terminó sin éxito
    // Si todos los usuarios han acabado de votar Y no hay matches encontrados
    let gameOver = false;
    if (room.usersDone && room.usersDone.length >= totalUsers && matches.length === 0) {
        gameOver = true;
    }

    res.json({ ...room.toObject(), matches, gameOver });
};
exports.startGame = async (req, res) => {
    const { code } = req.body;
    const room = await Room.findOneAndUpdate(
        { code },
        { status: 'voting' },
        { new: true }
    );
    if (!room) return res.status(404).json({ error: "Sala no existe" });
    res.json({ success: true, room });
};

// 3. ELIMINAR SALA
exports.deleteRoom = async (req, res) => {
    const { code } = req.body;
    await Room.findOneAndDelete({ code });
    res.json({ success: true });
};