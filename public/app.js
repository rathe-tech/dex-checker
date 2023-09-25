window.onload = async () => {
  const dexSelect = document.getElementById("dex");
  const poolAddressInput = document.getElementById("pool-address");
  const nftAddressInput = document.getElementById("nft-address");
  const checkPositionButton = document.getElementById("check-position");
  const responseElem = document.getElementById("response");

  checkPositionButton.addEventListener("click", async () => {
    const dex = dexSelect.value;
    const poolAddress = poolAddressInput.value.trim();
    const nftAddress = nftAddressInput.value.trim();

    const position = await getDexPosition({ dex, poolAddress, nftAddress });
    responseElem.textContent = JSON.stringify(position, null, 4);
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