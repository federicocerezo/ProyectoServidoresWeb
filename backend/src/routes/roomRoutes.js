const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");
const verifyToken = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /create-room:
 *   post:
 *     summary: Crea una sala nueva
 *     tags:
 *       - Rooms
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: Juan
 *     responses:
 *       200:
 *         description: Sala creada correctamente
 */
router.post('/create-room', verifyToken, roomController.createRoom);

/**
 * @swagger
 * /join-room:
 *   post:
 *     summary: Unirse a una sala existente
 *     tags:
 *       - Rooms
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario unido a la sala
 *       404:
 *         description: Sala no encontrada
 */
router.post('/join-room', verifyToken, roomController.joinRoom);

/**
 * @swagger
 * /vote:
 *   post:
 *     summary: Votar por un restaurante en una sala
 *     tags:
 *       - Rooms
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               restaurantId:
 *                 type: number
 *     responses:
 *       200:
 *         description: Voto registrado correctamente
 *       404:
 *         description: Sala no encontrada
 */
router.post('/vote', verifyToken, roomController.vote);

/**
 * @swagger
 * /room/{code}:
 *   get:
 *     summary: Obtener el estado de la sala
 *     tags:
 *       - Rooms
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Información de la sala
 *       404:
 *         description: Sala no encontrada
 */
router.get('/room/:code', roomController.getRoom);

/**
 * @swagger
 * /start-game:
 *   post:
 *     summary: Inicia la fase de votación en una sala
 *     tags:
 *       - Rooms
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Juego iniciado correctamente
 *       404:
 *         description: Sala no encontrada
 */
router.post('/start-game', verifyToken, roomController.startGame);

/**
 * @swagger
 * /delete-room:
 *   post:
 *     summary: Elimina una sala
 *     tags:
 *       - Rooms
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sala eliminada
 */
router.post('/delete-room', verifyToken, roomController.deleteRoom);

/**
 * @swagger
 * /finish-voting:
 *   post:
 *     summary: Marca a un usuario como que ha terminado de votar
 *     tags:
 *       - Rooms
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.post('/finish-voting', verifyToken, roomController.finishVoting);
module.exports = router;
