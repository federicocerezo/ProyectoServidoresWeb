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
  price: { 
    type: String, 
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