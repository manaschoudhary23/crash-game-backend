const express = require("express");
const Player = require("../models/Player");
const { getPrice } = require("../services/priceService");

const router = express.Router();

router.get("/wallet/:playerId", async (req, res) => {
  const player = await Player.findById(req.params.playerId);
  if (!player) return res.status(404).json({ error: "Player not found" });

  const btc = await getPrice("bitcoin");
  const eth = await getPrice("ethereum");

  res.json({
    bitcoin: { balance: player.wallet.bitcoin, usd: player.wallet.bitcoin * btc },
    ethereum: { balance: player.wallet.ethereum, usd: player.wallet.ethereum * eth }
  });
});

module.exports = router;
