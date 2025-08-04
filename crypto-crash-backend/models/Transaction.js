const mongoose = require("mongoose");

const txSchema = new mongoose.Schema({
  playerId: String,
  usdAmount: Number,
  cryptoAmount: Number,
  currency: String,
  type: String, 
  txHash: String,
  priceAtBet: Number,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Transaction", txSchema);
