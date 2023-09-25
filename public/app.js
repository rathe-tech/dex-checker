window.onload = async () => {
  const platformSelect = document.getElementById("platform");

  const kaminoPanel = document.getElementById("kamino-panel");
  const dexPanel = document.getElementById("dex-panel");

  const strategyAddressInput = document.getElementById("strategy-address");

  const dexSelect = document.getElementById("dex");
  const poolAddressInput = document.getElementById("pool-address");
  const nftAddressInput = document.getElementById("nft-address");
  const checkPositionButton = document.getElementById("check-position");
  const responseElem = document.getElementById("response");

  const usdcMintAddress = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const usdcDecimals = 6;

  let isKamino = true;

  platformSelect.addEventListener("change", e => {
    if (e.target.value === "KAMINO") {
      isKamino = true;
      kaminoPanel.classList.remove("hidden");
      dexPanel.classList.add("hidden");
    } else {
      isKamino = false;
      kaminoPanel.classList.add("hidden");
      dexPanel.classList.remove("hidden");
    }
  });

  if (localStorage.getItem("platform") != null) {
    platformSelect.value = localStorage.getItem("platform");
  }
  strategyAddressInput.value = localStorage.getItem("strategyAddress");
  if (localStorage.getItem("dex") != null) {
    dexSelect.value = localStorage.getItem("dex");
    dexSelect.dispatchEvent(new Event("change"));
  }
  poolAddressInput.value = localStorage.getItem("poolAddress");
  nftAddressInput.value = localStorage.getItem("nftAddress");

  strategyAddressInput.addEventListener("change", e => {
    localStorage.setItem("strategyAddress", e.target.value);
  });

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

    const strategyAddress = strategyAddressInput.value.trim();

    try {
      const tokenList = await getTokenList();
      const symbols = new Map(tokenList.map(x => [x.address, x.symbol]));

      function getSymbol(mintAddress) {
        const symbol = symbols.get(mintAddress);
        return symbol ?? mintAddress;
      }

      const position = isKamino ?
        await getKaminoDexPosition(strategyAddress) :
        await getDexPosition({ dex, poolAddress, nftAddress });

      const {
        mints: [mintA, mintB, ...rewardMints],
        liquidity,
        pendingFees,
        pendingRewards,
        price,
        invertedPrice,
        range,
        invertedRange,
        inRange
      } = position;

      const symbolA = getSymbol(mintA.address);
      const symbolB = getSymbol(mintB.address);

      const amountA = new Decimal(liquidity[0]);
      const amountB = new Decimal(liquidity[1]);

      const tokenASymbolElems = document.getElementsByClassName("token-a-symbol");
      const tokenBSymbolElems = document.getElementsByClassName("token-b-symbol");

      for (let elem of tokenASymbolElems) {
        elem.textContent = symbolA;
      }

      for (let elem of tokenBSymbolElems) {
        elem.textContent = symbolB;
      }

      const tokenAAmountElem = document.getElementById("token-a-amount");
      const tokenBAmountElem = document.getElementById("token-b-amount");

      tokenAAmountElem.textContent = amountA.div(10 ** mintA.decimals).toDecimalPlaces(mintA.decimals);
      tokenBAmountElem.textContent = amountB.div(10 ** mintB.decimals).toDecimalPlaces(mintB.decimals);

      const worthInAElem = document.getElementById("worth-in-a-value");
      const worthInBElem = document.getElementById("worth-in-b-value");

      const priceBPerA = await getPrice(mintA.address, mintB.address);
      const amountAinB = amountA.div(10 ** mintA.decimals).mul(new Decimal(priceBPerA)); //await getQuote(mintA.address, mintB.address, amountA);
      const positionInB = amountB.div(10 ** mintB.decimals).add(amountAinB).toDecimalPlaces(mintB.decimals);
    
      const priceAPerB = await getPrice(mintB.address, mintA.address);
      const amountBinA = amountB.div(10 ** mintB.decimals).mul(new Decimal(priceAPerB)); //await getQuote(mintB.address, mintA.address, amountB);
      const positionInA = amountA.div(10 ** mintA.decimals).add(amountBinA).toDecimalPlaces(mintA.decimals);

      worthInAElem.textContent = positionInA;
      worthInBElem.textContent = positionInB;

      const worthInUsdcInfoElem = document.getElementById("worth-in-usdc-info");
      if (mintA.address !== usdcMintAddress && mintB.address !== usdcMintAddress) {
        const worthInUsdcElem = document.getElementById("worth-in-usdc-value");

        try {
          const priceUsdcPerA = await getPrice(mintA.address, usdcMintAddress);
          const priceUsdcPerB = await getPrice(mintB.address, usdcMintAddress);

          const amountAinUsdc = amountA.div(10 ** mintA.decimals).mul(new Decimal(priceUsdcPerA));
          const amountBinUsdc = amountB.div(10 ** mintB.decimals).mul(new Decimal(priceUsdcPerB));

          const amountsInUsdc = amountAinUsdc.add(amountBinUsdc).toDecimalPlaces(usdcDecimals);//.div(10 ** usdcDecimals);
          worthInUsdcElem.textContent = amountsInUsdc;
        } catch (e) {
          worthInUsdcElem.textContent = "Not enough liquidity to compute";
          console.error(e);
        }

        worthInUsdcInfoElem.classList.remove("hidden");
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

      const feesAElem = document.getElementById("fees-a-amount");
      const feesBElem = document.getElementById("fees-b-amount");

      const feesAInUsdcElem = document.getElementById("fees-a-in-usdc-amount");
      const feesBInUsdcElem = document.getElementById("fees-b-in-usdc-amount");

      const feesA = new Decimal(pendingFees[0]);
      const feesB = new Decimal(pendingFees[1]);

      const priceAinUsdc = await getPrice(mintA.address, usdcMintAddress);
      const priceBinUsdc = await getPrice(mintB.address, usdcMintAddress);

      const feesAinUsdc = feesA.mul(priceAinUsdc); //await getQuote(mintA.address, usdcMintAddress, feesA);
      const feesBinUsdc = feesB.mul(priceBinUsdc); //await getQuote(mintB.address, usdcMintAddress, feesB);

      feesAElem.textContent = feesA.div(10 ** mintA.decimals);
      feesBElem.textContent = feesB.div(10 ** mintB.decimals);
      
      feesAInUsdcElem.textContent = feesAinUsdc.div(10 ** usdcDecimals);
      feesBInUsdcElem.textContent = feesBinUsdc.div(10 ** usdcDecimals);

      const rewards0Elem = document.getElementById("rewards-0");
      const rewards1Elem = document.getElementById("rewards-0");
      const rewards2Elem = document.getElementById("rewards-0");
      const rewardElems = [rewards0Elem, rewards1Elem, rewards2Elem];
      rewardElems.forEach(x => x.classList.add("hidden"));

      const rewards0SymbolElem = document.getElementById("rewards-0-symbol");
      const rewards1SymbolElem = document.getElementById("rewards-1-symbol");
      const rewards2SymbolElem = document.getElementById("rewards-2-symbol");
      const rewardSymbolElems = [rewards0SymbolElem, rewards1SymbolElem, rewards2SymbolElem];

      const rewards0AmountElem = document.getElementById("rewards-0-amount");
      const rewards1AmountElem = document.getElementById("rewards-1-amount");
      const rewards2AmountElem = document.getElementById("rewards-2-amount");
      const rewardAmountElems = [rewards0AmountElem, rewards1AmountElem, rewards2AmountElem];

      const rewards0InUsdcAmountElem = document.getElementById("rewards-0-in-usdc-amount");
      const rewards1InUsdcAmountElem = document.getElementById("rewards-1-in-usdc-amount");
      const rewards2InUsdcAmountElem = document.getElementById("rewards-2-in-usdc-amount");
      const rewardInUsdcAmountElems = [rewards0InUsdcAmountElem, rewards1InUsdcAmountElem, rewards2InUsdcAmountElem];

      const rewardsInUsdc = await Promise.all(pendingRewards.map(async (x, i) =>
        getQuote(rewardMints[i].address, usdcMintAddress, x)
      ));

      pendingRewards.forEach((x, i) => {
        rewardElems[i].classList.remove("hidden");
        rewardSymbolElems[i].textContent = getSymbol(rewardMints[i].address);
        rewardAmountElems[i].textContent = new Decimal(x).div(10 ** rewardMints[i].decimals);
        rewardInUsdcAmountElems[i].textContent = rewardsInUsdc[i].div(10 ** usdcDecimals);
      });

      const allRewardsInUsdc = rewardsInUsdc.reduce((acc, x) => acc.add(x), new Decimal(0));
      const pendingUsdc = feesAinUsdc.add(feesAinUsdc).add(allRewardsInUsdc).div(10 ** usdcDecimals);
      const pendingFeesAndRewardsElem = document.getElementById("pending-fees-and-rewards");
      pendingFeesAndRewardsElem.textContent = pendingUsdc;

      responseElem.classList.remove("hidden");
    } catch (e) {
      console.error(e);
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
  const raw = await response.json();
  return new Decimal(raw);
}

async function getPrice(inputMint, outputMint) {
  const response = await fetch("/.netlify/functions/get_price", {
    method: "POST",
    body: JSON.stringify({ inputMint, outputMint })
  });
  if (response.status !== 200) {
    throw new Error(`HTTP status: ${response.status}`);
  }
  return await response.json();
}

async function getTokenList() {
  const response = await fetch("/.netlify/functions/token_list");
  return await response.json();
}