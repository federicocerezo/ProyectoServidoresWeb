const Restaurant = require("../models/Restaurant");

exports.getRestaurants = async (req, res) => {
    try {
        const { type, maxPrice, limit, ids } = req.query;
        let query = {};

        // 1. Filtrar por IDs (Favoritos)
        if (ids) {
            const idArray = ids.split(',').map(Number);
            query.id = { $in: idArray };
        } 
        // 2. Filtros del Juego
        else {
            // Filtro de Tipo
            if (type && type !== 'Any' && type !== 'Todos') {
                query.type = type;
            }
            // Filtro de Precio
            // NOTA: Esto asume que en tu Atlas el precio es un NÚMERO.
            // Si en Atlas tienes "30€" (texto), este filtro numérico fallará.
            if (maxPrice && maxPrice !== 'Any') {
                query.averagePrice = { $lte: parseInt(maxPrice) };
            }
        }

        let mongooseQuery = Restaurant.find(query);

        if (limit) {
            mongooseQuery = mongooseQuery.limit(parseInt(limit));
        }

        const restaurants = await mongooseQuery;

        // Randomizar orden si es para el juego
        if (!ids) {
            restaurants.sort(() => Math.random() - 0.5);
        }

        res.json(restaurants);
    } catch (e) {
        console.error("Error obteniendo restaurantes:", e);
        res.status(500).json({ error: e.message });
    }
};