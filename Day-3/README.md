# Transfer USDC with Gas Estimation

using the ethers.js estimateGas function

## Usage

Rename .env.example to .env\
Update the params in the .env


Approve USDC to TransferUSDC.sol

In the terminal\
run\
npx hardhat run .\scripts\ApproveUSDC.js


Run the tests

In the terminal\
run\
npx hardhat test


## Output


  Get gas estimation then call transferUSDC with new gas limit + 10%\
Estimating gas for transferUsdc() !\
✔ Estimated gas: 406804\
✔ New Gas Limit + 10%:  447484\
Calling transferUsdc() !  
✔ Transaction successful!\
✔ TransferUSDC transaction hash:  0xd3ffe9557f036b8f230b328171619cd98a30c36a09e6317d856f538e11adbfdc\
    ✔ Should send USDC to receiver and return ccipReceive gas (7202ms)


  1 passing (7s)


![alt text](https://github.com/leetebbs/ccip_bootcamp_homework/blob/main/Homework_day_3/ccip_image.PNG?raw=true)
