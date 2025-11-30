const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: String,
    type: String,
    price: String,
    rating: Number,
    image: String
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);