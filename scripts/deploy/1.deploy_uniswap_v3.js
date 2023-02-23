const hre = require("hardhat");

const WETH9 = require("../abis/WETH9.json");
const UniswapV3Factory = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json");

const NFTDescriptor = require("../../artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json");
const NonfungibleTokenPositionDescriptor = require("../../artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json");
const NonfungiblePositionManager = require("../../artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");
const Quoter = require("../../artifacts/contracts/lens/Quoter.sol/Quoter.json");
const QuoterV2 = require("../../artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json");
const TickLens = require("../../artifacts/contracts/lens/TickLens.sol/TickLens.json");
const UniswapInterfaceMulticall = require("../../artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json");

const linkLibraries = require("./linkLibraries");
const { isBytes } = require("ethers/lib/utils");
async function main() {

  const accounts = await hre.ethers.getSigners();
  const deployer = accounts[0];
  console.log(deployer.address);
  /*
  ///=========== WETH9
  const Weth9 = new hre.ethers.ContractFactory(WETH9.abi, WETH9.bytecode, deployer);
  const _weth9 = await Weth9.deploy();
  await _weth9.deployed();
  console.log(`WETH9 deployed to ${_weth9.address}`);

  let _weth9_code = await hre.ethers.provider.getCode(_weth9.address);
  if (_weth9_code === '0x')  console.log('WETH9 is null')

  ///=========== UniswapV3Factory
  const uniswapV3Factory = new hre.ethers.ContractFactory(UniswapV3Factory.abi, UniswapV3Factory.bytecode, deployer);
  const _uniswapV3Factory = await uniswapV3Factory.deploy();
  await _uniswapV3Factory.deployed();
  console.log(`UniswapV3Factory deployed to ${_uniswapV3Factory.address}`);

  let _uniswapV3Factory_code = await hre.ethers.provider.getCode(_uniswapV3Factory.address);
  if (_uniswapV3Factory_code === '0x')  console.log('uniswapV3Factory is null')

  let Weth9Address = _weth9.address
  let UniswapV3FactoryAddress = _uniswapV3Factory.address
  */

  // WETH9 deployed to 0xFb3911c46B85D8958740eCD2322E8346f2FdCD83
  // UniswapV3Factory deployed to 0xc6cBe5b07508B86790019E4966Fa8D9019ac2FFc
  let Weth9Address = "0xFb3911c46B85D8958740eCD2322E8346f2FdCD83"
  let UniswapV3FactoryAddress = "0xc6cBe5b07508B86790019E4966Fa8D9019ac2FFc"

  ///=========== SwapRouter
  // const swapRouter = new hre.ethers.ContractFactory(SwapRouter.abi, SwapRouter.bytecode, deployer);

  const swapRouter = await hre.ethers.getContractFactory("SwapRouter");

  const _swapRouter = await swapRouter.deploy(UniswapV3FactoryAddress, Weth9Address);
  await _swapRouter.deployed();
  console.log(`SwapRouter deployed to ${_swapRouter.address}`);

  let _swapRouter_code = await hre.ethers.provider.getCode(_swapRouter.address);
  if (_swapRouter_code === '0x')  console.log('_swapRouter is null')


  ///=========== NFTDescriptor
  const nFTDescriptor = new hre.ethers.ContractFactory(NFTDescriptor.abi, NFTDescriptor.bytecode, deployer);
  const _nFTDescriptor = await nFTDescriptor.deploy();
  await _nFTDescriptor.deployed();
  console.log(`NFTDescriptor deployed to ${_nFTDescriptor.address}`);

  let _nFTDescriptor_code = await hre.ethers.provider.getCode(_nFTDescriptor.address);
  if (_nFTDescriptor_code === '0x')  console.log('_nFTDescriptor is null')

  ///=========== NonfungibleTokenPositionDescriptor
  const linkedBytecode = linkLibraries(
    {
      bytecode: NonfungibleTokenPositionDescriptor.bytecode,
      linkReferences: NonfungibleTokenPositionDescriptor.linkReferences,
    },
    {
      NFTDescriptor: _nFTDescriptor.address,
    }
  );

  const nonfungibleTokenPositionDescriptor = new hre.ethers.ContractFactory(
    NonfungibleTokenPositionDescriptor.abi,
    linkedBytecode,
    deployer
    );

  const nativeCurrencyLabelBytes = await hre.ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TON"));

  const _nonfungibleTokenPositionDescriptor = await nonfungibleTokenPositionDescriptor.deploy(
    Weth9Address,
    nativeCurrencyLabelBytes);
  await _nonfungibleTokenPositionDescriptor.deployed();
  console.log(`NonfungibleTokenPositionDescriptor deployed to ${_nonfungibleTokenPositionDescriptor.address}`);


  let _nonfungibleTokenPositionDescriptor_code = await hre.ethers.provider.getCode(_nonfungibleTokenPositionDescriptor.address);
  if (_nonfungibleTokenPositionDescriptor_code === '0x')  console.log('_nonfungibleTokenPositionDescriptor is null')

  ///=========== NonfungiblePositionManager
  const nonfungiblePositionManager = new hre.ethers.ContractFactory(NonfungiblePositionManager.abi,
    NonfungiblePositionManager.bytecode, deployer);
  const _nonfungiblePositionManager = await nonfungiblePositionManager.deploy(
    UniswapV3FactoryAddress,
    Weth9Address,
    _nonfungibleTokenPositionDescriptor.address
    );
  await _nonfungiblePositionManager.deployed();
  console.log(`NonfungiblePositionManager deployed to ${_nonfungiblePositionManager.address}`);


  let _nonfungiblePositionManager_code = await hre.ethers.provider.getCode(_nonfungiblePositionManager.address);
  if (_nonfungiblePositionManager_code === '0x')  console.log('_nonfungiblePositionManager is null')

  //=============== Quoter
  const quoter = new hre.ethers.ContractFactory(Quoter.abi, Quoter.bytecode, deployer);
  const _quoter = await quoter.deploy(
    UniswapV3FactoryAddress,
    Weth9Address
    );
  await _quoter.deployed();
  console.log(`Quoter deployed to ${_quoter.address}`);


  //=============== QuoterV2
  const quoterV2 = new hre.ethers.ContractFactory(QuoterV2.abi, QuoterV2.bytecode, deployer);
  const _quoterV2 = await quoterV2.deploy(
    UniswapV3FactoryAddress,
    Weth9Address
    );
  await _quoterV2.deployed();
  console.log(`QuoterV2 deployed to ${_quoterV2.address}`);


  //=============== TickLens
  const tickLens = new hre.ethers.ContractFactory(TickLens.abi, TickLens.bytecode, deployer);
  const _tickLens = await tickLens.deploy();
  await _tickLens.deployed();
  console.log(`TickLens deployed to ${_tickLens.address}`);


  //=============== UniswapInterfaceMulticall
  const uniswapInterfaceMulticall = new hre.ethers.ContractFactory(UniswapInterfaceMulticall.abi, UniswapInterfaceMulticall.bytecode, deployer);
  const _uniswapInterfaceMulticall = await uniswapInterfaceMulticall.deploy();
  await _uniswapInterfaceMulticall.deployed();
  console.log(`UniswapInterfaceMulticall deployed to ${_uniswapInterfaceMulticall.address}`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});