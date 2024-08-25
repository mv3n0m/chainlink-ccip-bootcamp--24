const hre = require("hardhat");
const { expect } = require("chai");


describe("CCIP Cross Chain Name Service - Register Alice, Lookup Alice and Return her EOA address from both chains", function () {

    let localSimulator;
    let config:any;
    let sourceCrossChainNameServiceLookup:any;
    let sourceCrossChainNameServiceRegister: any;
    let destinationCrossChainNameServiceLookup:any;
    let crossChainNameServiceReceiver;
    let alice: any;
   

    before(async function () {
    [alice] = await hre.ethers.getSigners();
    console.log("alice's address: ", alice.address);
    // Create localSimulator instance
    const localSimulatorFactory = await hre.ethers.getContractFactory("CCIPLocalSimulator");
    localSimulator = await localSimulatorFactory.deploy();
    console.log("CCIP Local simulator address: ", localSimulator.address);

    // Call the configuration() function to get Router contract address
    config = await localSimulator.configuration();
    // console.log(config)

    //Deploy contracts on the source chain

    // Create instance of CrossChainNameServiceLookup
    const CrossChainNameServiceLookup = await hre.ethers.getContractFactory("CrossChainNameServiceLookup");
    sourceCrossChainNameServiceLookup = await CrossChainNameServiceLookup.deploy();
    console.log("CrossChainNameServiceLookup address: ", sourceCrossChainNameServiceLookup.address);

    // Create instance of CrossChainNameServiceRegister
    const CrossChainNameServiceRegister = await hre.ethers.getContractFactory("CrossChainNameServiceRegister");
    sourceCrossChainNameServiceRegister = await CrossChainNameServiceRegister.deploy(
    config.sourceRouter_,
    sourceCrossChainNameServiceLookup.address
    );
    console.log("CrossChainNameServiceRegister address: ", sourceCrossChainNameServiceRegister.address);

    // Deploy contracts on the destination chain

    // Create instance of CrossChainNameServiceLookup
    const DestinationCrossChainNameServiceLookup = await hre.ethers.getContractFactory("CrossChainNameServiceLookup");
    destinationCrossChainNameServiceLookup = await DestinationCrossChainNameServiceLookup.deploy();
    console.log("CrossChainNameServiceLookup address: ", destinationCrossChainNameServiceLookup.address);

    // Create instance of CrossChainNameServiceReceiver
    const CrossChainNameServiceReceiver = await hre.ethers.getContractFactory("CrossChainNameServiceReceiver");
    crossChainNameServiceReceiver = await CrossChainNameServiceReceiver.deploy(
    config.destinationRouter_,
    destinationCrossChainNameServiceLookup.address,
    config.chainSelector_
    );
    console.log("CrossChainNameServiceReceiver address: ", crossChainNameServiceReceiver.address);

    // Set CrossChainNameService address on both chains
    let txResponse = await sourceCrossChainNameServiceLookup.setCrossChainNameServiceAddress(sourceCrossChainNameServiceRegister.address);
    console.log("sourceSetCrossChainNameServiceAddress transaction: ", txResponse.hash);
    txResponse = await destinationCrossChainNameServiceLookup.setCrossChainNameServiceAddress(crossChainNameServiceReceiver.address);
    console.log("destinationSetCrossChainNameServiceAddress transaction: ", txResponse.hash);
    // Enable chain on CrossChainNameServiceRegister
    txResponse = await sourceCrossChainNameServiceRegister.enableChain(config.chainSelector_, crossChainNameServiceReceiver.address, 500_000n);
    console.log("sourceEnableChain transaction: ", txResponse.hash);

    });

    it("Should register alice.ccns on the source chain and check that the registering address is the same on both chains", async function () {
    // Connect Alice
    const aliceConnected = await sourceCrossChainNameServiceRegister.connect(alice);
    console.log("")

    // // Register Alice in CrossChainNameServiceRegister
    try {
        const res = await aliceConnected.register("alice.ccns");
        console.log("Registration successful:");
        } catch (error) {
        console.error("Registration failed:", error);
        }
       
        // Lookup Alice and return the address
        const sourceLookup = await sourceCrossChainNameServiceLookup.lookup("alice.ccns");
        console.log("Returned source Lookup address: ", sourceLookup);
        const destinationLookup = await destinationCrossChainNameServiceLookup.lookup("alice.ccns");
        console.log("Returned destination Lookup address: ", destinationLookup);

        expect(sourceLookup).to.equal(await alice.getAddress());
        expect(destinationLookup).to.equal(await alice.getAddress());
    });
});