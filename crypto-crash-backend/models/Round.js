const mongoose = require("mongoose");

const roundSchema = new mongoose.Schema({
  number: Number,
  crashPoint: Number,
  bets: [{
    playerId: String,
    crypto: String,
    cryptoAmount: Number,
    usdAmount: Number,
    cashedOut: Boolean,
    cashMultiplier: Number
  }]
});

module.exports = mongoose.model("Round", roundSchema);
