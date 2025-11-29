const Model = {
    user: "",
    roomCode: "",
    participants: [],
    currentIndex: 0,
    matches: [],
    activeFilters: { type: 'Any', price: 'Any' },
    restaurants: [
        { id: 1, name: "La Burgería", type: "Americana", price: "€€", rating: 4.5, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60" },
        { id: 2, name: "Sushi Zen", type: "Japonesa", price: "€€€", rating: 4.8, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=500&q=60" },
        { id: 3, name: "Pizza Napoli", type: "Italiana", price: "€€", rating: 4.6, image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=500&q=60" },
        { id: 4, name: "Tacos Rey", type: "Mexicana", price: "€", rating: 4.3, image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=500&q=60" },
        { id: 5, name: "Curry House", type: "India", price: "€€", rating: 4.7, image: "https://images.unsplash.com/photo-1585937421612-70a008356f36?auto=format&fit=crop&w=500&q=60" }
    ]
};
