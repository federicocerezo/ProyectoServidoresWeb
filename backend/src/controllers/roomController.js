const Room = require("../models/Room");

exports.createRoom = async (req, res) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newRoom = new Room({
        code,
        users: [req.body.username]
    });

    await newRoom.save();

    res.json({ success: true, roomCode: code, room: newRoom });
};

exports.joinRoom = async (req, res) => {
    const { code, username } = req.body;
    const room = await Room.findOne({ code });

    if (!room) return res.status(404).json({ error: "Sala no existe" });
    if (!room.users.includes(username)) {
        room.users.push(username);
        await room.save();
    }

    res.json({ success: true, room });
};

exports.vote = async (req, res) => {
    const { code, restaurantId } = req.body;

    const room = await Room.findOne({ code });
    if (!room) return res.status(404).json({ error: "Sala no existe" });

    const current = room.votes.get(String(restaurantId)) || 0;
    room.votes.set(String(restaurantId), current + 1);

    await room.save();
    res.json({ success: true });
};

exports.getRoom = async (req, res) => {
    const room = await Room.findOne({ code: req.params.code });
    res.json(room);
};
