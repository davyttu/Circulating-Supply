require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");

const app = express();

// Debug : Vérifier si les variables d'environnement sont bien chargées
console.log("INFURA_API_KEY:", process.env.INFURA_API_KEY);
console.log("TOKEN_CONTRACT_ADDRESS:", process.env.TOKEN_CONTRACT_ADDRESS);
console.log("COMMUNITY_ADDRESS:", process.env.COMMUNITY_ADDRESS);
console.log("LIQUIDITY_POOL_ADDRESS:", process.env.LIQUIDITY_POOL_ADDRESS);

// Configuration blockchain - Utilisation correcte de la clé API
const provider = new ethers.providers.JsonRpcProvider(`https://base-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`);
const tokenContractAddress = process.env.TOKEN_CONTRACT_ADDRESS;
const communityAddress = process.env.COMMUNITY_ADDRESS;
const liquidityPoolAddress = process.env.LIQUIDITY_POOL_ADDRESS;

// ABI partielle pour les événements ERC20
const abi = [
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// Initialisation du contrat
const tokenContract = new ethers.Contract(tokenContractAddress, abi, provider);

// Fonction pour calculer la circulating supply
async function calculateCirculatingSupply() {
    let circulatingSupply = ethers.BigNumber.from(0);

    // Filtrer les événements Transfer émis par le contrat
    const transferEvents = await tokenContract.queryFilter(
        tokenContract.filters.Transfer()
    );

    // Parcourir les événements pour compter les tokens sortants
    transferEvents.forEach((event) => {
        const { from, to, value } = event.args;

        // Si les tokens sortent de communityAddress ou de liquidityPoolAddress
        if (from.toLowerCase() === communityAddress.toLowerCase() || from.toLowerCase() === liquidityPoolAddress.toLowerCase()) {
            circulatingSupply = circulatingSupply.add(value);
        }
    });

    // Retourner la circulating supply en unités humaines (18 décimales)
    return Math.floor(parseFloat(ethers.utils.formatUnits(circulatingSupply, 18)));
}

// Endpoint pour la circulating supply
app.get("/circulating-supply", async (req, res) => {
    try {
        const circulatingSupply = await calculateCirculatingSupply();
        res.send(circulatingSupply.toString()); // Envoi de la valeur sans décimales
    } catch (error) {
        console.error("Erreur lors du calcul de la circulating supply:", error);
        res.status(500).send("Erreur serveur");
    }
});

// Vercel gère automatiquement le déploiement
module.exports = app;
