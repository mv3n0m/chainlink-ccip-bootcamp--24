const dotenv = require("dotenv"); 
dotenv.config();
const { ethers } = require("ethers");
const usdcABI = require("../abi/usdcABI.js");
const fujiUSDCContractAddress = "0x5425890298aed601595a70AB815c96711a31Bc65";
const transferUSDCAddress = "0xE0a9e4C5aaf8a40eFD7B7737E2A79a1bC8E2B722"

const privateKey = process.env.PRIVATE_KEY;
const provider = new ethers.JsonRpcProvider(
  process.env.AVALANCHE_FUJI_RPC_URL
);
const signer = new ethers.Wallet(privateKey, provider);
const amount = ethers.parseUnits("1", 6); // 1 USDC

//approve usdc

async function main() {
  const contract = new ethers.Contract(
    fujiUSDCContractAddress,
    usdcABI,
    signer
  );
  console.log("Approving USDC...");
  const tx = await contract.approve(
    transferUSDCAddress,
    amount
  );
  const receipt = await tx.wait();
  console.log("Approve USDC tx hash: ", receipt.hash);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});