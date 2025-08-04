const axios = require("axios");

let cache = {};
let lastFetched = 0;

async function getPrice(crypto) {
  const now = Date.now();
  if (cache[crypto] && (now - lastFetched < 10000)) {
    return cache[crypto];
  }

  const res = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
    params: {
      ids: "bitcoin,ethereum",
      vs_currencies: "usd",
    },
  });

  cache = {
    bitcoin: res.data.bitcoin.usd,
    ethereum: res.data.ethereum.usd,
  };

  lastFetched = now;
  return cache[crypto];
}

module.exports = { getPrice };
