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
  nftAddressInput.value = localStorage.getItem("poolAddress");

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
    const dex = dexSelect.value;
    const poolAddress = poolAddressInput.value.trim();
    const nftAddress = nftAddressInput.value.trim();

    try {
      const position = await getDexPosition({ dex, poolAddress, nftAddress });
      responseElem.textContent = JSON.stringify(position, null, 4);
    } catch (e) {
      alert(`Can't fetch data ${e}`);
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