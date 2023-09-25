window.onload = async () => {
  const dexSelect = document.getElementById("dex");
  const poolAddressInput = document.getElementById("pool-address");
  const nftAddressInput = document.getElementById("nft-address");
  const checkPositionButton = document.getElementById("check-position");
  const responseElem = document.getElementById("response");

  const usdcMintAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const usdcDecimals = 6;

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
    responseElem.classList.add("hidden");

    const dex = dexSelect.value;
    const poolAddress = poolAddressInput.value.trim();
    const nftAddress = nftAddressInput.value.trim();

    try {
      const position = await getDexPosition({ dex, poolAddress, nftAddress });

      const {
        mints: [mintA, mintB, ...rewardMints],
        liquidity,
        price,
        invertedPrice,
        range,
        invertedRange,
        inRange
      } = position;

      const symbolA = getSymbol(mintA.address);
      const symbolB = getSymbol(mintB.address);

      const amountA = new Decimal(liquidity[0]);
      const amountB = new Decimal(liquidity[0]);

      const tokenASymbolElems = document.getElementsByClassName("token-a-symbol");
      const tokenBSymbolElems = document.getElementsByClassName("token-b-symbol");

      for (let elem of tokenASymbolElems) {
        elem.textContent = symbolA;
      }

      for (let elem of tokenBSymbolElems) {
        elem.textContent = symbolB;
      }

      const worthInAElem = document.getElementById("worth-in-a-value");
      const worthInBElem = document.getElementById("worth-in-b-value");

      const amountAinB = await getQuote(mintA.address, mintB.address, amountA);
      const positionInB = amountB.add(amountAinB).div(10 ** mintB.decimals).toDecimalPlaces(mintB.decimals).toNumber();
    
      const amountBinA = await getQuote(mintB.address, mintA.address, amountB);
      const positionInA = amountA.add(amountBinA).div(10 ** mintA.decimals).toDecimalPlaces(mintA.decimals).toNumber();

      worthInAElem.textContent = positionInA;
      worthInBElem.textContent = positionInB;

      const worthInUsdcInfoElem = document.getElementById("worth-in-b-info");
      if (mintA.address !== usdcMintAddress && mintB.address !== usdcMintAddress) {

        const amountAinUsdc = await getQuote(mintA.address, usdcMintAddress, amountA);
        const amountBinUsdc = await getQuote(mintB.address, usdcMintAddress, amountB);

        const amountsInUsdc = amountAinUsdc.add(amountBinUsdc).div(10 ** usdcDecimals).toNumber();

        worthInUsdcInfoElem.classList.remove("hidden");
        const worthInUsdcElem = document.getElementById("worth-in-b-info");
        worthInUsdcElem.textContent = amountsInUsdc;
      } else {
        worthInUsdcInfoElem.classList.add("hidden");
      }

      const priceElem = document.getElementById("price-value");
      const invertedPriceElem = document.getElementById("inverted-price-value");

      priceElem.textContent = new Decimal(price).toDecimalPlaces(mintB.decimals);
      invertedPriceElem.textContent = new Decimal(invertedPrice).toDecimalPlaces(mintA.decimals);

      const rangeElem = document.getElementById("range-value");
      const invertedRangeElem = document.getElementById("inverted-range-value");

      rangeElem.textContent = `${new Decimal(range[0]).toDecimalPlaces(mintB.decimals)} - ${new Decimal(range[1]).toDecimalPlaces(mintB.decimals)}`;
      invertedRangeElem.textContent = `${new Decimal(invertedRange[0]).toDecimalPlaces(mintA.decimals)} - ${new Decimal(invertedRange[1]).toDecimalPlaces(mintA.decimals)}`;

      const inRangeElem = document.getElementById("in-range-value");
      inRangeElem.textContent = inRange;
      inRangeElem.style.color = inRange ? "limegreen" : "red";

      responseElem.classList.remove("hidden");
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

async function getQuote(inputMint, outputMint, amount) {
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