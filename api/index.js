const { Web3 } = require("web3");
require("dotenv").config();

// Configuration blockchain
const web3 = new Web3(`https://base-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`);
const tokenContractAddress = process.env.TOKEN_CONTRACT_ADDRESS;
const communityAddress = process.env.COMMUNITY_ADDRESS;
const liquidityPoolAddress = process.env.LIQUIDITY_POOL_ADDRESS;

// ABI pour l'événement Transfer
const abi = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "from", "type": "address" },
      { "indexed": true, "name": "to", "type": "address" },
      { "indexed": false, "name": "value", "type": "uint256" }
    ],
    "name": "Transfer",
    "type": "event"
  }
];

// Initialisation du contrat
const tokenContract = new web3.eth.Contract(abi, tokenContractAddress);

// Fonction pour calculer la circulating supply
async function calculateCirculatingSupply() {
    try {
        let circulatingSupply = BigInt(0);

        const transferEvents = await tokenContract.getPastEvents('Transfer', {
            fromBlock: 0,
            toBlock: 'latest'
        });

        transferEvents.forEach((event) => {
            const { from, value } = event.returnValues;

            if (from.toLowerCase() === communityAddress.toLowerCase() || from.toLowerCase() === liquidityPoolAddress.toLowerCase()) {
                circulatingSupply += BigInt(value);
            }
        });

        return web3.utils.fromWei(circulatingSupply.toString(), 'ether');
    } catch (error) {
        console.error("Erreur lors du calcul de la circulating supply:", error);
        throw new Error("Erreur interne lors du calcul de la circulating supply");
    }
}

// Configuration Express
const express = require("express");
const app = express();

// Page d'accueil
app.get("/", (req, res) => {
    res.send("Bienvenue sur l'API. Utilisez /q=circulating pour obtenir la circulating supply.");
});

// Route CoinMarketCap
app.get("/q=circulating", async (req, res) => {
    try {
        const circulatingSupply = await calculateCirculatingSupply();
        res.json({ circulating_supply: circulatingSupply });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur, veuillez réessayer plus tard." });
    }
});

// Démarrer le serveur
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${port}`);
});
