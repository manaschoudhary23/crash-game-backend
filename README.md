# 💥 Crypto Crash Game

A real-time multiplayer game where players bet using cryptocurrency before the multiplier "crashes". The goal is to cash out before it’s too late!

---

## 🚀 Live Demo

- **Frontend:** [https://crash-game-backend-txei.vercel.app](https://crash-game-backend-txei.vercel.app)
- **Backend API:** [https://crash-game-backend-pdre.onrender.com](https://crash-game-backend-pdre.onrender.com)

---

## 🧠 Features

- 🎯 Real-time multiplier crash system
- 💸 Bet and cash out system
- 🔁 Continuous round generation
- 💼 Wallet balance per cryptocurrency
- 📦 MongoDB for persistence
- 🌐 REST + WebSocket integration

---

## 🧾 Sample Player Document (MongoDB)

```json
{
  "_id": { "$oid": "64ef7d278a3b627a4e64c71c" },
  "wallet": {
    "bitcoin": { "$numberDouble": "0.05" },
    "ethereum": { "$numberDouble": "1.0" }
  }
}
