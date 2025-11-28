import express from "express";
import { PrismaClient } from '@prisma/client'
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const app = express();
const prisma = new PrismaClient();
app.use(express.json());

app.use(express.static(__dirname)); // Sirve index.html y js

app.post("/api/rooms", async (req, res) => {
    const { username } = req.body;

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const room = await prisma.room.create({
        data: {
            code,
            users: { create: { name: username } },
        },
        include: { users: true }
    });

    res.json(room);
});

app.post("/api/rooms/:code/join", async (req, res) => {
    const { code } = req.params;
    const { username } = req.body;

    const room = await prisma.room.findUnique({
        where: { code }
    });

    if (!room) return res.status(404).json({ error: "Sala no encontrada" });

    const user = await prisma.user.create({
        data: {
            name: username,
            roomId: room.id
        }
    });
    res.json(user);
});

app.post("/api/rooms/:code/vote", async (req, res) => {
    const { code } = req.params;
    const { userId, restaurantId, liked } = req.body;

    const room = await prisma.room.findUnique({
        where: { code }
    });

    const vote = await prisma.vote.create({
        data: {
            userId,
            restaurantId,
            roomId: room.id,
            liked
        }
    });

    res.json(vote);
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
