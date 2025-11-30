const Restaurant = require("../models/Restaurant");

exports.getRestaurants = async (req, res) => {
    try {
        const { type, maxPrice, limit, ids } = req.query;
        let query = {};

        // 1. Filtrar por IDs (Lógica principal ahora)
        if (ids) {
            const idArray = ids.split(',').map(Number);
            query.id = { $in: idArray };
            
            // Buscamos los restaurantes
            const restaurants = await Restaurant.find(query);

            // --- CAMBIO CLAVE: Ordenar resultados según el orden de 'ids' ---
            // Esto asegura que si la sala dice [5, 2, 8], todos reciban [5, 2, 8]
            restaurants.sort((a, b) => {
                return idArray.indexOf(a.id) - idArray.indexOf(b.id);
            });

            return res.json(restaurants);
        } 
        
        // 2. Filtros (Solo para pruebas o uso sin sala)
        // ... resto del código tal cual estaba para queries manuales ...
        else {
            if (type && type !== 'Any' && type !== 'Todos') {
                query.type = type;
            }
            if (maxPrice && maxPrice !== 'Any') {
                query.averagePrice = { $lte: parseInt(maxPrice) };
            }
            
            const restaurants = await Restaurant.find(query);
            restaurants.sort(() => Math.random() - 0.5);
            if (limit && restaurants.length > parseInt(limit)) {
                restaurants.splice(parseInt(limit));
            }
            res.json(restaurants);
        }

    } catch (e) {
        console.error("Error obteniendo restaurantes:", e);
        res.status(500).json({ error: e.message });
    }
};