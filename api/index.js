// api/circulating-supply.js
const Web3 = require("web3");
require("dotenv").config();

const web3 = new Web3(`https://base-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`);
const tokenContractAddress = process.env.TOKEN_CONTRACT_ADDRESS;
const communityAddress = process.env.COMMUNITY_ADDRESS;
const liquidityPoolAddress = process.env.LIQUIDITY_POOL_ADDRESS;

const abi = [ /* ABI du contrat ici */ ];

const tokenContract = new web3.eth.Contract(abi, tokenContractAddress);

module.exports = async (req, res) => {
    try {
        console.log("Received request for circulating supply.");
        
        // Calcul de la circulating supply
        let circulatingSupply = web3.utils.toBN(0);
        const transferEvents = await tokenContract.getPastEvents('Transfer', {
            fromBlock: 0,
            toBlock: 'latest'
        });

        transferEvents.forEach((event) => {
            const { from, to, value } = event.returnValues;
            if (from.toLowerCase() === communityAddress.toLowerCase() || from.toLowerCase() === liquidityPoolAddress.toLowerCase()) {
                circulatingSupply = circulatingSupply.add(web3.utils.toBN(value));
            }
        });

        const supplyInEther = web3.utils.fromWei(circulatingSupply, 'ether');
        console.log("Calculated circulating supply:", supplyInEther);
        res.status(200).send(supplyInEther);
    } catch (error) {
        console.error("Error during request:", error);
        res.status(500).send("Error while calculating circulating supply");
    }
};
