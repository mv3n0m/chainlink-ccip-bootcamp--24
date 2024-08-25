const dotenv = require("dotenv");
dotenv.config();
const { ethers } = require("ethers");
const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const {
  SwapTestnetUSDCcontractAddress,
  CrossChainReceivercontractAddress,
  transferUSDCcontractAddress,
} = require("../contractAddress");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const contractPath = path.resolve(
  __dirname,
  "../artifacts/contracts/TransferUSDC.sol/TransferUSDC.json"
);
const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const abi = contractJson.abi;

describe("Get gas estimation then call transferUSDC with new gas limit + 10%", function () {
  // console.log("Contract address: ", CrossChainReceivercontractAddress, " ", SwapTestnetUSDCcontractAddress, " ", transferUSDCcontractAddress);
  async function setup() {
    const privateKey = process.env.PRIVATE_KEY;
    const provider = new ethers.JsonRpcProvider(
      process.env.AVALANCHE_FUJI_RPC_URL
    );
    const signer = new ethers.Wallet(privateKey, provider);
    const amount = ethers.parseUnits("1", 6); // 1 USDC
    let gasEstimate;

    // const fujiTransferUSDCAddress = transferUSDCcontractAddress; // Fuji
    // const SwapTestnetUSDCAddress = SwapTestnetUSDCcontractAddress; // Sepolia
    // const CrossChainReceiverAddress = CrossChainReceivercontractAddress; //sepolia

    const fujiTransferUSDCAddress =
      "0xE0a9e4C5aaf8a40eFD7B7737E2A79a1bC8E2B722"; // Fuji
    const SwapTestnetUSDCAddress = "0x227057a19bD328521626b47085812Ca304f26dD2"; // Sepolia
    const CrossChainReceiverAddress =
      "0xD5f6Cc44D7ba02376b658B7d63EC73984D1c5E19"; //sepolia
    const destinationChainSelector = "16015286601757825753";

    return {
      fujiTransferUSDCAddress,
      SwapTestnetUSDCAddress,
      CrossChainReceiverAddress,
      signer,
      destinationChainSelector,
      amount,
    };
  }

  it("Should send USDC to receiver and return ccipReceive gas", async function () {
    const greenCheckmark = "\x1b[32m✔\x1b[0m";

    const {
      fujiTransferUSDCAddress,
      CrossChainReceiverAddress,
      signer,
      destinationChainSelector,
      amount,
    } = await loadFixture(setup);

    console.log("Estimating gas for transferUsdc() !");

    // Create a contract instance
    const fujiTransferUSDCContract = new ethers.Contract(
      fujiTransferUSDCAddress,
      abi,
      signer
    );

    // Estimate gas using ethers
    try {
      gasEstimate = await fujiTransferUSDCContract.transferUsdc.estimateGas(
        destinationChainSelector,
        CrossChainReceiverAddress,
        1000000,
        500000
      );

      console.log(`${greenCheckmark} Estimated gas: ${gasEstimate.toString()}`);
    } catch (error) {
      console.log(error);
    }

    //increase the gas limitby 10%
    gasLimit = (gasEstimate * BigInt(110)) / BigInt(100);

    console.log(`${greenCheckmark} New Gas Limit + 10%: `, gasLimit.toString());
    console.log("Calling transferUsdc() !");

    // Call transferUsdc() with the new gas limit
    try {
      const txResponse = await fujiTransferUSDCContract.transferUsdc(
        destinationChainSelector,
        CrossChainReceiverAddress,
        amount,
        gasLimit
      );
      await txResponse.wait();
      console.log(`${greenCheckmark} Transaction successful!`);
      console.log(
        `${greenCheckmark} TransferUSDC transaction hash: `,
        txResponse.hash
      );
    } catch (error) {
      console.log(error);
    }
  });
});
