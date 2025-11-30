const Room = require("../models/Room");

const Restaurant = require("../models/Restaurant");
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

// Marcar usuario como finalizado de forma segura
exports.finishVoting = async (req, res) => {
    const { code, username } = req.body;
    
    // Usamos $addToSet para evitar duplicados si el frontend reintenta la petición
    await Room.findOneAndUpdate(
        { code },
        { $addToSet: { usersDone: username } },
        { new: true }
    );
    res.json({ success: true });
};

// Obtener estado de la sala con detección robusta de Fin de Juego
exports.getRoom = async (req, res) => {
    try {
        const room = await Room.findOne({ code: req.params.code });
        if (!room) return res.status(404).json({ error: "Sala no encontrada" });

        const matches = [];
        // Aseguramos que usamos el número real de usuarios registrados
        const totalUsers = room.users ? room.users.length : 0;
        
        // Calcular matches iterando sobre el Mapa de votos
        if (room.votes && room.votes.size > 0) {
            for (const [restId, count] of room.votes) {
                // Si los votos alcanzan el total de usuarios, es un match
                if (totalUsers > 0 && count >= totalUsers) {
                    matches.push(Number(restId));
                }
            }
        }

        // Lógica de Game Over (Sin coincidencia)
        let gameOver = false;
        
        // Contamos cuántos han terminado
        const doneCount = room.usersDone ? room.usersDone.length : 0;

        // CONDICIÓN: Si todos terminaron Y no se ha encontrado ningún match
        if (totalUsers > 0 && doneCount >= totalUsers && matches.length === 0) {
            gameOver = true;
        }

        // Devolvemos el objeto plano con las propiedades calculadas
        res.json({ ...room.toObject(), matches, gameOver });
        
    } catch (e) {
        console.error("Error en getRoom:", e);
        res.status(500).json({ error: "Error interno" });
    }
};
exports.startGame = async (req, res) => {
    const { code } = req.body;
    
    // 1. Buscamos la sala primero
    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ error: "Sala no existe" });

    // 2. Si es una sala normal (no tiene IDs predefinidos), generamos la lista ahora
    if (room.allowedIds.length === 0) {
        // Recuperamos los filtros guardados
        const { type, price, limit } = room.filters || {}; 
        
        let query = {};
        // Filtro Tipo
        if (type && type !== 'Any' && type !== 'Todos') {
            query.type = type;
        }
        // Filtro Precio (guardado como 'price' en room, pero es averagePrice en Restaurant)
        if (price && price !== 'Any') {
            query.averagePrice = { $lte: parseInt(price) };
        }

        // A. Buscamos TODOS los candidatos
        let candidates = await Restaurant.find(query);

        // B. Barajamos (Shuffle) AQUÍ, una sola vez para todos
        candidates.sort(() => Math.random() - 0.5);

        // C. Recortamos según el límite elegido
        const limitVal = parseInt(limit) || 20;
        if (candidates.length > limitVal) {
            candidates = candidates.slice(0, limitVal);
        }

        // D. Guardamos los IDs resultantes en la sala
        room.allowedIds = candidates.map(r => r.id);
    } else {
        // Si es sala de Favoritos, también los barajamos para que el orden sea común
        room.allowedIds.sort(() => Math.random() - 0.5);
    }

    // 3. Cambiamos estado y guardamos
    room.status = 'voting';
    await room.save();

    res.json({ success: true, room });
};

// 3. ELIMINAR SALA
exports.deleteRoom = async (req, res) => {
    const { code } = req.body;
    await Room.findOneAndDelete({ code });
    res.json({ success: true });
};

