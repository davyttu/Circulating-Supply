const Web3 = require("web3");
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
    let circulatingSupply = web3.utils.toBN(0);  // Déclare circulatingSupply comme un objet BigNumber de Web3

    // Filtrer les événements Transfer émis par le contrat
    const transferEvents = await tokenContract.getPastEvents('Transfer', {
        fromBlock: 0,  // Choisis le bloc de départ selon tes besoins (ex. block 0)
        toBlock: 'latest' // Le dernier bloc (le plus récent)
    });

    // Parcourir les événements pour compter les tokens sortants
    transferEvents.forEach((event) => {
        const { from, to, value } = event.returnValues;

        // Si les tokens sortent de communityAddress ou de liquidityPoolAddress
        if (from.toLowerCase() === communityAddress.toLowerCase() || from.toLowerCase() === liquidityPoolAddress.toLowerCase()) {
            circulatingSupply = circulatingSupply.add(web3.utils.toBN(value));
        }
    });

    // Retourner la circulating supply en unités humaines (18 décimales)
    return web3.utils.fromWei(circulatingSupply, 'ether');  // Retourne la circulating supply en "ether" (avec 18 décimales)
}

// Test de la fonction dans un endpoint Express
const express = require('express');
const app = express();

app.get("/circulating-supply", async (req, res) => {
    try {
        const circulatingSupply = await calculateCirculatingSupply();
        res.send(circulatingSupply.toString()); // Envoi de la valeur sans décimales
    } catch (error) {
        console.error("Erreur lors du calcul de la circulating supply:", error);
        res.status(500).send("Erreur serveur");
    }
});

module.exports = app;