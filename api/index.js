const { Web3 } = require("web3"); // Importation de Web3
require("dotenv").config();
const express = require("express");

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
    const transferEvents = await tokenContract.getPastEvents("Transfer", {
        fromBlock: 0,  // Choisis le bloc de départ selon tes besoins (ex. block 0)
        toBlock: "latest" // Le dernier bloc (le plus récent)
    });

    // Parcourir les événements pour compter les tokens sortants
    transferEvents.forEach((event) => {
        const { from, to, value } = event.returnValues;

        // Si les tokens sortent de communityAddress ou de liquidityPoolAddress
        if (from.toLowerCase() === communityAddress.toLowerCase() || from.toLowerCase() === liquidityPoolAddress.toLowerCase()) {
            circulatingSupply += BigInt(value); // Utilisation de BigInt pour l'addition
        }
    });

    // Retourner la circulating supply en unités humaines (18 décimales)
    return web3.utils.fromWei(circulatingSupply.toString(), "ether");  // Convertir BigInt en chaîne avant fromWei
}

// Route pour vérifier si l'API fonctionne
app.get("/", (req, res) => {
    res.send("L'API fonctionne. Utilisez /api.dws?q=circulating pour obtenir les données.");
});

// Route pour récupérer la circulating supply
app.get("/api.dws", async (req, res) => {
    try {
        // Vérifier si le paramètre "q" est égal à "circulating"
        if (req.query.q === "circulating") {
            const circulatingSupply = await calculateCirculatingSupply();
            // Retourne uniquement la valeur de la circulating supply
            res.send(circulatingSupply);
        } else {
            // Si le paramètre "q" n'est pas "circulating", retourner une erreur
            res.status(400).send("Paramètre invalide. Utilisez ?q=circulating.");
        }
    } catch (error) {
        console.error("Erreur lors du calcul de la circulating supply:", error);
        res.status(500).send("Erreur serveur");
    }
});

// Lancer le serveur sur le port 3000
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}`);
});