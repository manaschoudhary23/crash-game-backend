import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io("http://localhost:5000"); 

const playerId = "64ef7d278a3b627a4e64c71c";

function Game() {
  const [multiplier, setMultiplier] = useState(1.0);
  const [status, setStatus] = useState("Waiting...");
  const [crashPoint, setCrashPoint] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [usdAmount, setUsdAmount] = useState('');

  useEffect(() => {
    socket.on("round_start", handleRoundStart);
    socket.on("multiplier_update", handleMultiplierUpdate);
    socket.on("round_crash", handleRoundCrash);
    socket.on("error_message", (msg) => alert("⚠️ " + msg));
    socket.on("bet_placed", ({ usdAmount, cryptoAmount, currency }) => {
      setStatus(`✅ Bet Placed: $${usdAmount} (${cryptoAmount.toFixed(6)} ${currency})`);
    });
    socket.on("cashout_success", ({ multiplier, usd }) => {
      setStatus(`💰 Cashed out at ${multiplier}x - You won $${usd}`);
    });

    return () => {
      socket.off("round_start");
      socket.off("multiplier_update");
      socket.off("round_crash");
      socket.off("error_message");
      socket.off("bet_placed");
      socket.off("cashout_success");
    };
  }, []);

  const handleRoundStart = () => {
    setMultiplier(1.0);
    setCrashPoint(null);
    setStatus("🚀 Game Started");
    setCountdown(null);
  };

  const handleMultiplierUpdate = ({ multiplier }) => {
    setMultiplier(parseFloat(multiplier));
  };

  const handleRoundCrash = ({ crashPoint }) => {
    setCrashPoint(crashPoint);
    setStatus(`💥 Crashed at ${crashPoint}x`);
    startCountdown();
  };

  const handleBetSubmit = () => {
    const amount = parseFloat(usdAmount);
    if (!amount || amount <= 0) {
      alert("Enter a valid USD amount.");
      return;
    }

    socket.emit("place_bet", {
      playerId,
      usdAmount: amount,
      crypto: "bitcoin"
    });

    setUsdAmount('');
    setBetModalOpen(false);
  };

  const handleCashout = () => {
    socket.emit("cashout", { playerId });
    setStatus("💰 Cashout Requested");
  };

  const startCountdown = () => {
    let timeLeft = 10;
    setCountdown(timeLeft);
    const interval = setInterval(() => {
      timeLeft -= 1;
      setCountdown(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(interval);
        setCountdown(null);
      }
    }, 1000);
  };

  return (
    <div className="game-container">
      {countdown !== null && (
        <p className="countdown">Next round in: {countdown}s</p>
      )}

      <p className="multiplier-text">
        Multiplier: <span className="multiplier">{multiplier.toFixed(2)}x</span>
      </p>

      <p>Status: {status}</p>

      {crashPoint && (
        <p className="crash-text">Crashed at: {crashPoint}x</p>
      )}

      <div className="btn-group">
        <button onClick={() => setBetModalOpen(true)}>💸 Place Bet</button>
        <button onClick={handleCashout}>🏦 Cash Out</button>
      </div>

      {betModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Place Your Bet</h3>
            <input
              type="number"
              placeholder="Enter USD amount"
              value={usdAmount}
              onChange={(e) => setUsdAmount(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={handleBetSubmit}>Submit</button>
              <button onClick={() => setBetModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game;
