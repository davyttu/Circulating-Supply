const Web3 = require("web3");
require("dotenv").config();

// Configuration blockchain - Utilisation de la clé API via variable d'environnement
const web3 = new Web3(`https://base-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`);
const tokenContractAddress = process.env.TOKEN_CONTRACT_ADDRESS;
const communityAddress = process.env.COMMUNITY_ADDRESS;
const liquidityPoolAddress = process.env.LIQUIDITY_POOL_ADDRESS;

// Log les variables d'environnement pour s'assurer qu'elles sont correctement définies
console.log("INFURA_API_KEY:", process.env.INFURA_API_KEY);
console.log("TOKEN_CONTRACT_ADDRESS:", tokenContractAddress);
console.log("COMMUNITY_ADDRESS:", communityAddress);
console.log("LIQUIDITY_POOL_ADDRESS:", liquidityPoolAddress);

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
    console.log("Début du calcul de la circulating supply");

    // Filtrer les événements Transfer émis par le contrat
    try {
        const transferEvents = await tokenContract.getPastEvents('Transfer', {
            fromBlock: 0,  // Choisis le bloc de départ selon tes besoins (ex. block 0)
            toBlock: 'latest' // Le dernier bloc (le plus récent)
        });

        console.log("Événements de transfert récupérés:", transferEvents.length);

        // Parcourir les événements pour compter les tokens sortants
        transferEvents.forEach((event) => {
            const { from, to, value } = event.returnValues;

            console.log(`Événement : De ${from} vers ${to}, valeur: ${value}`);

            // Si les tokens sortent de communityAddress ou de liquidityPoolAddress
            if (from.toLowerCase() === communityAddress.toLowerCase() || from.toLowerCase() === liquidityPoolAddress.toLowerCase()) {
                circulatingSupply = circulatingSupply.add(web3.utils.toBN(value));
                console.log(`Ajout de ${value} à la circulating supply`);
            }
        });

        // Retourner la circulating supply en unités humaines (18 décimales)
        const formattedSupply = web3.utils.fromWei(circulatingSupply, 'ether');
        console.log("Circulating supply calculée:", formattedSupply);
        return formattedSupply;
    } catch (error) {
        console.error("Erreur lors de la récupération des événements de transfert:", error);
        throw error;
    }
}

// Test de la fonction dans un endpoint Express
const express = require('express');
const app = express();

app.get("/circulating-supply", async (req, res) => {
    try {
        console.log("Requête reçue pour /circulating-supply");
        const circulatingSupply = await calculateCirculatingSupply();
        console.log("Réponse à envoyer:", circulatingSupply);
        res.send(circulatingSupply.toString()); // Envoi de la valeur sans décimales
    } catch (error) {
        console.error("Erreur lors du calcul de la circulating supply:", error);
        res.status(500).send("Erreur serveur");
    }
});

// Lancer le serveur sur le port 3000
app.listen(3000, () => {
  console.log("Serveur en cours d'exécution sur http://localhost:3000");
});
