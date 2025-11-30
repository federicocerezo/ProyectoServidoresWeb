const Restaurant = require("../models/Restaurant");

// Datos iniciales para sembrar la DB
const INITIAL_DATA = [
    { id: 1, name: "La Burgería", type: "Americana", price: "€€", rating: 4.5, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60" },
    { id: 2, name: "Sushi Zen", type: "Japonesa", price: "€€€", rating: 4.8, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=500&q=60" },
    { id: 3, name: "Pizza Napoli", type: "Italiana", price: "€€", rating: 4.6, image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=500&q=60" },
    { id: 4, name: "Tacos Rey", type: "Mexicana", price: "€", rating: 4.3, image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=500&q=60" },
    { id: 5, name: "Curry House", type: "India", price: "€€", rating: 4.7, image: "https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=500&q=60" }
];

exports.seedRestaurants = async () => {
    try {
        const count = await Restaurant.countDocuments();
        if (count === 0) {
            await Restaurant.insertMany(INITIAL_DATA);
            console.log("✅ Restaurantes iniciales cargados en DB");
        }
    } catch (error) {
        console.error("Error seeding restaurants:", error);
    }
};

exports.getRestaurants = async (req, res) => {
    try {
        const { type, price, ids } = req.query;
        let query = {};

        // 1. Filtrar por lista de IDs (para Sala de Favoritos)
        if (ids) {
            const idArray = ids.split(',').map(Number);
            query.id = { $in: idArray };
        } 
        // 2. Filtrar por Tipo y Precio (para Sala Normal con filtros)
        else {
            if (type && type !== 'Any') query.type = type;
            if (price && price !== 'Any') query.price = price;
        }

        const restaurants = await Restaurant.find(query);
        res.json(restaurants);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};