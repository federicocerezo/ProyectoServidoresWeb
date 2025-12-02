const Restaurant = require("../models/Restaurant");

exports.getRestaurants = async (req, res) => {
    try {
        const { type, maxPrice, limit, ids } = req.query;
        let query = {};

        // 1. Filtrar por IDs (Lógica para favoritos o salas específicas)
        if (ids) {
            const idArray = ids.split(',').map(Number);
            query.id = { $in: idArray };
            const restaurants = await Restaurant.find(query);
            restaurants.sort((a, b) => idArray.indexOf(a.id) - idArray.indexOf(b.id));
            return res.json(restaurants);
        } 
        
        // 2. Filtros generales
        else {
            // Filtro por tipo directo en Mongo
            if (type && type !== 'Any' && type !== 'Todos') {
                query.type = type;
            }

            // Obtenemos todos los candidatos que coincidan con el tipo
            let restaurants = await Restaurant.find(query);

            // FILTRO DE PRECIO EN MEMORIA (JavaScript)
            // Como el precio es "15€", usamos parseInt para extraer el 15 y comparar
            if (maxPrice && maxPrice !== 'Any') {
                const max = parseInt(maxPrice);
                restaurants = restaurants.filter(r => {
                    // parseInt("15€") devuelve 15
                    const priceNum = parseInt(r.price); 
                    return priceNum <= max;
                });
            }
            
            // Aleatoriedad y límite
            restaurants.sort(() => Math.random() - 0.5);
            
            if (limit && restaurants.length > parseInt(limit)) {
                restaurants = restaurants.slice(0, parseInt(limit));
            }
            res.json(restaurants);
        }

    } catch (e) {
        console.error("Error obteniendo restaurantes:", e);
        res.status(500).json({ error: e.message });
    }
};