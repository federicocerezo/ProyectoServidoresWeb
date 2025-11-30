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
            // Filtro de Precio Numérico
            if (maxPrice && maxPrice !== 'Any') {
                query.averagePrice = { $lte: parseInt(maxPrice) };
            }
        }

        // --- CAMBIO CLAVE AQUÍ ---
        
        // Ejecutamos la búsqueda SIN límite en la base de datos
        // (Traemos todos los candidatos posibles para poder mezclarlos bien)
        const restaurants = await Restaurant.find(query);

        // Si es para el juego (no favoritos), aplicamos aleatoriedad y límite
        if (!ids) {
            // A. Barajamos (Shuffle) la lista completa
            restaurants.sort(() => Math.random() - 0.5);

            // B. Si hay límite y tenemos más restaurantes de los pedidos, cortamos la lista
            if (limit && restaurants.length > parseInt(limit)) {
                // .splice elimina los elementos sobrantes a partir del índice 'limit'
                // Dejando solo los 'limit' primeros elementos ya barajados
                restaurants.splice(parseInt(limit));
            }
        }

        res.json(restaurants);
    } catch (e) {
        console.error("Error obteniendo restaurantes:", e);
        res.status(500).json({ error: e.message });
    }
};