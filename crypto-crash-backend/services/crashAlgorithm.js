const crypto = require("crypto");

function getCrashPoint(roundNum, seed = "seed") {
  const h = crypto.createHash("sha256").update(seed + roundNum).digest("hex");
  const val = parseInt(h.slice(0, 8), 16);
  
  const r = val / 0xffffffff; 
  if (r === 1) return 1.0; 

  const crash = 1 / (1 - r); 

  const result = Math.min(Math.max(1.0, crash), 100.0);
  return parseFloat(result.toFixed(2));
}

module.exports = { getCrashPoint };
