require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io"); // ✅ Missing earlier
const cors = require("cors");
const crypto = require("crypto");

const Player = require("./models/Player");
const Round = require("./models/Round");
const Transaction = require("./models/Transaction");
const { getPrice } = require("./services/priceService");
const { getCrashPoint } = require("./services/crashAlgorithm");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", require("./routes/api"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://crash-game-backend-manaschoudhary23s-projects.vercel.app/"], 
    methods: ["GET", "POST"]
  }
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(console.error);

let round = null;
let multiplier = 1;
let timer = null;
let bets = new Map();
let roundCount = 1;
let crash = 0;

function startRound() {
  console.log(`\n🟢 Starting round #${roundCount}`);
  crash = getCrashPoint(roundCount);
  round = new Round({ number: roundCount, crashPoint: crash, bets: [] });
  bets.clear();
  multiplier = 1;

  io.emit("round_start");
  console.log(`💥 Crash point set to ${crash}x`);

  const startTime = Date.now();
  timer = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    multiplier = parseFloat((1.004 ** (elapsed * 100)).toFixed(2));
    io.emit("multiplier_update", { multiplier });

    if (multiplier >= crash) {
      endRound();
    }
  }, 100);
}

async function endRound() {
  clearInterval(timer);
  io.emit("round_crash", { crashPoint: crash.toFixed(2) });

  round.bets = Array.from(bets.values());
  await round.save();
  roundCount++;

  setTimeout(startRound, 10000);
}

io.on("connection", (socket) => {
  console.log("⚡ New client connected");

  socket.on("place_bet", async (data) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { playerId, usdAmount, crypto: currency } = data;
      const price = await getPrice(currency);
      const cryptoAmount = usdAmount / price;

      const player = await Player.findById(playerId).session(session);
      if (!player || player.wallet[currency] < cryptoAmount) {
        throw new Error("Insufficient balance");
      }

      player.wallet[currency] -= cryptoAmount;
      await player.save({ session });

      await new Transaction({
        playerId,
        usdAmount,
        cryptoAmount,
        currency,
        type: "bet",
        txHash: crypto.randomBytes(8).toString("hex"),
        priceAtBet: price,
        timestamp: new Date()
      }).save({ session });

      bets.set(playerId, {
        playerId,
        usdAmount,
        crypto: currency,
        cryptoAmount,
        cashedOut: false
      });

      await session.commitTransaction();
      socket.emit("bet_placed", { usdAmount, cryptoAmount, currency });
      console.log(`💰 Player ${playerId} bet $${usdAmount} in ${currency}`);
    } catch (err) {
      await session.abortTransaction();
      socket.emit("error_message", err.message); // ✅ Error to frontend
      console.error("❌ Bet transaction failed:", err.message);
    } finally {
      session.endSession();
    }
  });

  socket.on("cashout", async ({ playerId }) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const bet = bets.get(playerId);
      if (!bet || bet.cashedOut) throw new Error("Invalid or already cashed out");

      bet.cashedOut = true;
      bet.cashMultiplier = multiplier;

      const payoutCrypto = bet.cryptoAmount * multiplier;
      const price = await getPrice(bet.crypto);

      const player = await Player.findById(playerId).session(session);
      if (!player) throw new Error("Player not found");

      player.wallet[bet.crypto] += payoutCrypto;
      await player.save({ session });

      await new Transaction({
        playerId,
        usdAmount: payoutCrypto * price,
        cryptoAmount: payoutCrypto,
        currency: bet.crypto,
        type: "cashout",
        txHash: crypto.randomBytes(8).toString("hex"),
        priceAtBet: price,
        timestamp: new Date()
      }).save({ session });

      await session.commitTransaction();
      socket.emit("cashout_success", {
        multiplier: multiplier.toFixed(2),
        usd: (payoutCrypto * price).toFixed(2),
        crypto: payoutCrypto
      });

      io.emit("player_cashout", {
        playerId,
        cryptoPayout: payoutCrypto,
        usdPayout: (payoutCrypto * price).toFixed(2),
        multiplier: multiplier.toFixed(2)
      });

      console.log(`💸 Player ${playerId} cashed out at ${multiplier.toFixed(2)}x`);
    } catch (err) {
      await session.abortTransaction();
      socket.emit("error_message", err.message); // ✅ Error to frontend
      console.error("❌ Cashout transaction failed:", err.message);
    } finally {
      session.endSession();
    }
  });
});

startRound();

server.listen(process.env.PORT || 5000, () =>
  console.log(`🚀 Server listening on port ${process.env.PORT || 5000}`)
);
