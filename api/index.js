const Web3 = require("web3");
require("dotenv").config();
const express = require('express');

const app = express();

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
    let circulatingSupply = web3.utils.toBN(0);
    const BATCH_SIZE = 10000; // Nombre de blocs à récupérer par batch

    try {
        const latestBlock = await web3.eth.getBlockNumber();
        let fromBlock = Math.max(latestBlock - 500000, 0); // Limite aux 500 000 derniers blocs

        while (fromBlock < latestBlock) {
            const toBlock = Math.min(fromBlock + BATCH_SIZE, latestBlock);
            console.log(`Fetching events from block ${fromBlock} to ${toBlock}...`);

            const transferEvents = await tokenContract.getPastEvents('Transfer', {
                fromBlock,
                toBlock
            });

            // Traiter les événements
            transferEvents.forEach(event => {
                const { from, value } = event.returnValues;
                if (from.toLowerCase() === communityAddress.toLowerCase() || from.toLowerCase() === liquidityPoolAddress.toLowerCase()) {
                    circulatingSupply = circulatingSupply.add(web3.utils.toBN(value));
                }
            });

            fromBlock += BATCH_SIZE; // Passer au batch suivant
        }

        return web3.utils.fromWei(circulatingSupply, 'ether'); // Convertir en unités lisibles
    } catch (error) {
        console.error("Erreur lors du calcul de la circulating supply:", error);
        return "Erreur de récupération";
    }
}

// Route API pour récupérer la circulating supply
app.get("/circulating-supply", async (req, res) => {
    try {
        const circulatingSupply = await calculateCirculatingSupply();
        res.send(circulatingSupply.toString());
    } catch (error) {
        console.error("Erreur lors du calcul de la circulating supply:", error);
        res.status(500).send("Erreur serveur");
    }
});

// Lancer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
