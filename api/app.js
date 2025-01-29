require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");

const app = express();

// Vérification et affichage des variables d'environnement (TEMPORAIRE pour debug)
console.log("🔹 INFURA_API_KEY:", process.env.INFURA_API_KEY ? "OK" : "❌ MISSING");
console.log("🔹 TOKEN_CONTRACT_ADDRESS:", process.env.TOKEN_CONTRACT_ADDRESS || "❌ MISSING");
console.log("🔹 COMMUNITY_ADDRESS:", process.env.COMMUNITY_ADDRESS || "❌ MISSING");
console.log("🔹 LIQUIDITY_POOL_ADDRESS:", process.env.LIQUIDITY_POOL_ADDRESS || "❌ MISSING");

// Vérification des variables obligatoires
if (!process.env.INFURA_API_KEY || !process.env.TOKEN_CONTRACT_ADDRESS || !process.env.COMMUNITY_ADDRESS || !process.env.LIQUIDITY_POOL_ADDRESS) {
    console.error("❌ ERREUR: Certaines variables d'environnement sont manquantes !");
    process.exit(1); // Arrête l'exécution du serveur
}

// Connexion à Infura avec la clé API
const provider = new ethers.providers.JsonRpcProvider(`https://base-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`);
const tokenContractAddress = process.env.TOKEN_CONTRACT_ADDRESS;
const communityAddress = process.env.COMMUNITY_ADDRESS.toLowerCase();
const liquidityPoolAddress = process.env.LIQUIDITY_POOL_ADDRESS.toLowerCase();

// ABI partielle pour lire les événements Transfer d'un ERC20
const abi = [
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// Initialisation du contrat
const tokenContract = new ethers.Contract(tokenContractAddress, abi, provider);

// Fonction pour calculer la circulating supply
async function calculateCirculatingSupply() {
    try {
        let circulatingSupply = ethers.BigNumber.from(0);

        // Filtrer les événements Transfer émis par le contrat
        const transferEvents = await tokenContract.queryFilter(tokenContract.filters.Transfer());

        // Calculer la circulating supply
        transferEvents.forEach((event) => {
            const { from, to, value } = event.args;

            if (from.toLowerCase() === communityAddress || from.toLowerCase() === liquidityPoolAddress) {
                circulatingSupply = circulatingSupply.add(value);
            }
        });

        return Math.floor(parseFloat(ethers.utils.formatUnits(circulatingSupply, 18))); // Convertir en unités lisibles
    } catch (error) {
        console.error("❌ Erreur lors du calcul de la circulating supply:", error);
        throw new Error("Erreur serveur");
    }
}

// Endpoint pour obtenir la circulating supply
app.get("/circulating-supply", async (req, res) => {
    try {
        const circulatingSupply = await calculateCirculatingSupply();
        res.send(circulatingSupply.toString()); // Retourne la valeur sans décimales
    } catch (error) {
        res.status(500).send("Erreur serveur");
    }
});

// Exportation pour Vercel (pas besoin de app.listen)
module.exports = app;
