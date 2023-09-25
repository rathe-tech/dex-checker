window.onload = async () => {
  const dexSelect = document.getElementById("dex");
  const poolAddressInput = document.getElementById("pool-address");
  const nftAddressInput = document.getElementById("nft-address");
  const checkPositionButton = document.getElementById("check-position");
  const responseElem = document.getElementById("response");

  if (localStorage.getItem("dex") != null) {
    dexSelect.value = localStorage.getItem("dex");
  }
  poolAddressInput.value = localStorage.getItem("poolAddress");
  nftAddressInput.value = localStorage.getItem("nftAddress");

  dexSelect.addEventListener("change", e => {
    localStorage.setItem("dex", e.target.value);
  });
  poolAddressInput.addEventListener("change", e => {
    localStorage.setItem("poolAddress", e.target.value);
  });
  nftAddressInput.addEventListener("change", e => {
    localStorage.setItem("nftAddress", e.target.value);
  });

  checkPositionButton.addEventListener("click", async () => {
    checkPositionButton.setAttribute("disabled", true);

    const dex = dexSelect.value;
    const poolAddress = poolAddressInput.value.trim();
    const nftAddress = nftAddressInput.value.trim();

    try {
      const position = await getDexPosition({ dex, poolAddress, nftAddress });
      responseElem.textContent = JSON.stringify(position, null, 4);
    } catch (e) {
      alert(`Can't fetch data ${e}`);
    } finally {
      checkPositionButton.removeAttribute("disabled");
    }
  });
};

async function getDexPosition({ dex, poolAddress, nftAddress }) {
  const response = await fetch("/.netlify/functions/get_dex_position", {
    method: "POST",
    body: JSON.stringify({ dex, poolAddress, nftAddress })
  });
  if (response.status !== 200) {
    throw new Error(`HTTP status: ${response.status}`);
  }
  return await response.json();
}

async function getKaminoDexPosition(strategyAddress) {
  const response = await fetch("/.netlify/functions/get_kamino_dex_position", {
    method: "POST",
    body: JSON.stringify({ strategyAddress })
  });
  if (response.status !== 200) {
    throw new Error(`HTTP status: ${response.status}`);
  }
  return await response.json();
}

async function getQuote({ inputMint, outputMint, amount }) {
  const response = await fetch("/.netlify/functions/get_quote", {
    method: "POST",
    body: JSON.stringify({ inputMint, outputMint, amount })
  });
  if (response.status !== 200) {
    throw new Error(`HTTP status: ${response.status}`);
  }
  return await response.json();
}

function getSymbol(mintAddress) {
  const knowsSymbols = new Map([
    ["So11111111111111111111111111111111111111112", "SOL"],
    ["mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", "mSOL"],
    ["7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj", "stSOL"],
    ["4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R", "RAY"],
    ["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "USDC"],
    ["Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", "USDT"],
    ["6DNSN2BJsaPFdFFc1zP37kkeNe4Usc1Sqkzr9C9vPWcU", "tBTC"],
    ["4Njvi3928U3figEF5tf8xvjLC5GqUN33oe4XTJNe7xXC", "T"],
    ["orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE", "ORCA"],
    ["MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey", "MNDE"]
  ]);
  const symbol = knowsSymbols.get(mintAddress);
  return symbol ?? mintAddress;
}