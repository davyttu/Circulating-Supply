const { Web3 } = require("web3"); // Importation de Web3
require("dotenv").config();

// Configuration blockchain - Utilisation de la clé API via variable d'environnement
const web3 = new Web3(`https://base-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`);
const tokenContractAddress = process.env.TOKEN_CONTRACT_ADDRESS;
const communityAddress = process.env.COMMUNITY_ADDRESS;
const liquidityPoolAddress = process.env.LIQUIDITY_POOL_ADDRESS;

// ABI pour l'événement Transfer
const abi = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  }
];

// Initialisation du contrat
const tokenContract = new web3.eth.Contract(abi, tokenContractAddress);

// Fonction pour calculer la circulating supply
async function calculateCirculatingSupply() {
    let circulatingSupply = BigInt(0);  // Utilisation de BigInt au lieu de toBN

    // Filtrer les événements Transfer émis par le contrat
    const transferEvents = await tokenContract.getPastEvents('Transfer', {
        fromBlock: 0,  // Choisir le bloc de départ selon tes besoins (ex. block 0)
        toBlock: 'latest' // Le dernier bloc (le plus récent)
    });

    // Parcourir les événements pour compter les tokens sortants
    transferEvents.forEach((event) => {
        const { from, value } = event.returnValues;

        // Si les tokens sortent de communityAddress ou de liquidityPoolAddress
        if (from.toLowerCase() === communityAddress.toLowerCase() || from.toLowerCase() === liquidityPoolAddress.toLowerCase()) {
            circulatingSupply += BigInt(value); // Utilisation de BigInt pour l'addition
        }
    });

    // Retourner la circulating supply en unités humaines (18 décimales)
    return web3.utils.fromWei(circulatingSupply.toString(), 'ether');  // Convertir BigInt en chaîne avant fromWei
}

// Test de la fonction dans un endpoint Express
const express = require("express");
const app = express();

// ✅ Route racine pour éviter l'erreur "Cannot GET /"
app.get("/", (req, res) => {
    res.send("Bienvenue sur l'API de la Circulating Supply. Utilisez /q=circulating pour obtenir la valeur.");
});

// ✅ Route au format CoinMarketCap : /q=circulating
app.get("/q=circulating", async (req, res) => {
    try {
        const circulatingSupply = await calculateCirculatingSupply();
        res.send(circulatingSupply.toString()); // Envoi de la valeur sans décimales
    } catch (error) {
        console.error("Erreur lors du calcul de la circulating supply:", error);
        res.status(500).send("Erreur serveur");
    }
});

// Lancer le serveur sur le port 3000
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Serveur en cours d'exécution sur http://localhost:${port}`);
});
