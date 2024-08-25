const dotenv = require("dotenv"); 
dotenv.config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {

    //deploy TransferUSDC.sol on Avalanche Fuji
    const transferUSDCContractPath = path.resolve(
        __dirname,
        "../artifacts/contracts/TransferUSDC.sol/TransferUSDC.json"
      );
    const SwapTestnetUSDCContractPath = path.resolve(
        __dirname,
        "../artifacts/contracts/SwapTestnetUSDC.sol/SwapTestnetUSDC.json"
      );

      const CrossChainReceiverContractPath = path.resolve(
        __dirname,
        "../artifacts/contracts/CrossChainReceiver.sol/CrossChainReceiver.json"
      );
    
    const transferUSDCContractJson = JSON.parse(fs.readFileSync(transferUSDCContractPath, "utf8"));
    const transferUSDCabi = transferUSDCContractJson.abi;
    const transferUSDCbytecode = transferUSDCContractJson.bytecode;
    const SwapTestnetUSDCContractJson = JSON.parse(fs.readFileSync(SwapTestnetUSDCContractPath, "utf8"));
    const swapTestnetUSDCabi = SwapTestnetUSDCContractJson.abi;
    const swapTestnetUSDCbytecode = SwapTestnetUSDCContractJson.bytecode;
    const CrossChainReceiverContractJson = JSON.parse(fs.readFileSync(CrossChainReceiverContractPath, "utf8"));
    const crossChainReceiverabi = CrossChainReceiverContractJson.abi;
    const crossChainReceiverbytecode = CrossChainReceiverContractJson.bytecode;

    const privateKey = process.env.PRIVATE_KEY;
    const fujiProvider = new ethers.JsonRpcProvider(
      process.env.AVALANCHE_FUJI_RPC_URL
    );
    const sepoliaPovider = new ethers.JsonRpcProvider(process.env.ETHEREUM_SEPOLIA_RPC_URL);
    const fujiSigner = new ethers.Wallet(privateKey, fujiProvider);
    const sepoliaSigner = new ethers.Wallet(privateKey, sepoliaPovider);


    //deploy transferUSDC.sol on fuji
    console.log("Deploying TransferUSDC.sol on Fuji...");
    const ccipRouter = "0xF694E193200268f9a4868e4Aa017A0118C9a8177";
    const linkToken = "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846";
    const usdcToken = "0x5425890298aed601595a70AB815c96711a31Bc65";
    const wallet = new ethers.Wallet(privateKey, fujiProvider);
    const transferUSDCfactory = new ethers.ContractFactory(transferUSDCabi, transferUSDCbytecode, wallet);
    const transferUSDCcontract = await transferUSDCfactory.deploy(ccipRouter, linkToken, usdcToken);
    console.log('TransferUSDC Contract deployed to:',transferUSDCcontract.target);
   // Write the contract address to a .js file
   const contractAddressFilePath = path.resolve(__dirname, "../contractAddress.js");



//deploy SwapTestnetUSDC.sol on Ethereum Sepolia
console.log("deploying SwapTestnetUSDC smart contract on Ethereum Sepolia");
const compoundUdscToken = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const fauceteer ="0x68793eA49297eB75DFB4610B68e076D2A5c7646C";
const sepoliaWallet = new ethers.Wallet(privateKey, sepoliaPovider);
const swapTestnetUSDCfactory = new ethers.ContractFactory(swapTestnetUSDCabi, swapTestnetUSDCbytecode, sepoliaWallet);
const swapTestnetUSDCcontract = await swapTestnetUSDCfactory.deploy(usdcToken, compoundUdscToken, fauceteer);
console.log('SwapTestnetUSDC Contract deployed to:',swapTestnetUSDCcontract.target);


/// deploy on Ethereum Sepolia the CrossChainReceiver smart contract
console.log("deploying CrossChainReceiver smart contract on Ethereum Sepolia");
const sepoliaCcipRouterAddress ="0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59";
const cometAddress ="0xAec1F48e02Cfb822Be958B68C7957156EB3F0b6e"
const crossChainReceiverfactory = new ethers.ContractFactory(crossChainReceiverabi, crossChainReceiverbytecode, sepoliaWallet);
const crossChainReceivercontract = await crossChainReceiverfactory.deploy(sepoliaCcipRouterAddress, cometAddress, swapTestnetUSDCcontract.target);
const deploymentReciept = await crossChainReceivercontract.deploymentTransaction()?.wait(1)
console.log('CrossChainReceiverContract deployed to:', crossChainReceivercontract.target);

// Write the contract address's to a .js file
const contractAddresses = {
    SwapTestnetUSDCcontractAddress: swapTestnetUSDCcontract.target,
    transferUSDCcontractAddress: transferUSDCcontract.target,
    CrossChainReceivercontractAddress: crossChainReceivercontract.target
};
fs.writeFileSync(contractAddressFilePath, `module.exports = ${JSON.stringify(contractAddresses, null, 2)};`, { flag: 'w' });
console.log(`Contract addresses written to ${contractAddressFilePath}`);

//set ccip chain selector on crosschainreciever contract
await crossChainReceivercontract.allowlistSourceChain("14767482510784806043", true);
console.log("ccip chain selector set on crosschainreciever contract");

//set AllowListSender on crosschainreciever contract
await crossChainReceivercontract.allowlistSender(transferUSDCcontract.target, true);
console.log("AllowListSender set on crosschainreciever contract");

// Approve 1 USDC to be spent by TransferUSDC.sol
const usdcAbi = ["function approve(address _spender, uint256 _value) public returns (bool success)"];
const USDCContract = new ethers.Contract(usdcToken, usdcAbi, wallet);
const tx = await USDCContract.approve(transferUSDCcontract.target, 1000000);


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});