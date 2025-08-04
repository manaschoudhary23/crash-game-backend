const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  _id: { type: String }, 
  name: String,
  wallet: {
    bitcoin: { type: Number, default: 1 },  
    ethereum: { type: Number, default: 1 }, 
  }
});

module.exports = mongoose.model('Player', playerSchema);
