const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  id: { 
    type: Number, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    required: true 
  },
  // CAMBIO CLAVE: averagePrice es un número para poder filtrar (ej: 30)
  averagePrice: { 
    type: Number, 
    required: true 
  },
  address: { 
    type: String 
  },
  description: { 
    type: String 
  },
  rating: { 
    type: Number, 
    default: 0 
  },
  image: { 
    type: String 
  }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);