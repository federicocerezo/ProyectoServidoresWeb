const express = require("express");
const router = express.Router();
const restaurantController = require("../controllers/restaurantController");

/**
 * @swagger
 * /restaurants:
 *   get:
 *     summary: Obtener lista de restaurantes
 *     tags:
 *       - Restaurants
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Tipo de comida (ej. Italiana, Mexicana)
 *
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: string
 *         description: Precio máximo (ej. 15, 25, 40)
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Límite de resultados
 *
 *       - in: query
 *         name: ids
 *         schema:
 *           type: string
 *         description: Lista de IDs separados por comas
 *
 *     responses:
 *       200:
 *         description: Lista de restaurantes filtrada
 */
router.get("/", restaurantController.getRestaurants);

module.exports = router;