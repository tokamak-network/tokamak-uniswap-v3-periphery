// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {

  // tokamak-goerli
  //address _factory, address _WETH9
  const _factory = "0xcad3A069a1E4607eA204A889FDEbF29B4aC78F00"
  const _WETH9 = "0x67F3bE272b1913602B191B3A68F7C238A2D81Bb9"

  const Quoter = await hre.ethers.getContractFactory("Quoter");
  const quoter = await Quoter.deploy(_factory, _WETH9);

  await quoter.deployed();

  console.log(
    `Quoter deployed to ${quoter.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
