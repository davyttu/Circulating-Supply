require('dotenv').config();  // Charger les variables d'environnement
const express = require('express');
const Web3 = require('web3');

const app = express();

// Connexion à Infura via Web3
const web3 = new Web3(`https://base-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`);
const tokenContractAddress = process.env.TOKEN_CONTRACT_ADDRESS;
const communityAddress = process.env.COMMUNITY_ADDRESS;
const liquidityPoolAddress = process.env.LIQUIDITY_POOL_ADDRESS;

// ABI pour les événements Transfer (ERC20)
const abi = [
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// Créer une instance du contrat
const tokenContract = new web3.eth.Contract(abi, tokenContractAddress);

// Calcul de la circulating supply
async function calculateCirculatingSupply() {
  let circulatingSupply = web3.utils.toBN(0);

  // Récupérer les événements Transfer
  const transferEvents = await tokenContract.getPastEvents("Transfer", {
    fromBlock: 0,
    toBlock: "latest"
  });

  transferEvents.forEach((event) => {
    const { from, to, value } = event.returnValues;

    // Si les tokens proviennent du communityAddress ou liquidityPoolAddress
    if (
      from.toLowerCase() === communityAddress.toLowerCase() ||
      from.toLowerCase() === liquidityPoolAddress.toLowerCase()
    ) {
      circulatingSupply = circulatingSupply.add(web3.utils.toBN(value));
    }
  });

  return Math.floor(parseFloat(web3.utils.fromWei(circulatingSupply, 'ether')));
}

// Route API pour obtenir la circulating supply
app.get("/api/circulating-supply", async (req, res) => {
  try {
    const circulatingSupply = await calculateCirculatingSupply();
    res.send(circulatingSupply.toString());
  } catch (error) {
    console.error("Erreur lors du calcul de la circulating supply:", error);
    res.status(500).send("Erreur serveur");
  }
});

// Lancer le serveur en local
if (process.env.NODE_ENV !== "production") {
  app.listen(3000, () => {
    console.log("Serveur démarré sur http://localhost:3000");
  });
}

// Export pour Vercel (serverless)
module.exports = app;
