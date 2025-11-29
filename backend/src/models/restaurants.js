const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({ id: Number, name: String, type: String, price: String, address: String, description: String, rating: Number, image: String });

module.exports = mongoose.model('Restaurant', RestaurantSchema, 'restaurants');