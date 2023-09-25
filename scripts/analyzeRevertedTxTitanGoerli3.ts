import { Contract, BigNumberish, constants } from 'ethers'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, network, waffle } from 'hardhat'
import { IUniswapV3Factory, IWETH9, MockTimeSwapRouter } from '../typechain'
import {
  abi as FACTORY_ABI,
  bytecode as FACTORY_BYTECODE,
} from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json'
const providers = ethers.provider
import WETH9 from '../test/contracts/WETH9.json'
import {
  abi as SWAP_ROUTER_ABI,
  bytecode as SWAP_ROUTER_BYTECODE,
} from '@uniswap/swap-router-contracts/artifacts/contracts/SwapRouter02.sol/SwapRouter02.json'

async function main() {
  const chainId = network.config.chainId
  const accounts = await ethers.getSigners()
  const deployer = accounts[0]
  let factory: IUniswapV3Factory
  factory = (await waffle.deployContract(deployer, {
    bytecode: FACTORY_BYTECODE,
    abi: FACTORY_ABI,
  })) as IUniswapV3Factory
  console.log(deployer.address)
  const SQRT_RATIO_1_1 = ethers.BigNumber.from('92979860367883423878727417014')
  await network.provider.send('hardhat_setBalance', [deployer.address, '0x10000000000000000000000000'])
  const nftContractFactory = await ethers.getContractFactory('NonfungiblePositionManager', deployer)
  const weth9 = (await waffle.deployContract(deployer, {
    bytecode: WETH9.bytecode,
    abi: WETH9.abi,
  })) as IWETH9
  let nftDescripterAddress = '0xDC1Fa1B1F3d28E23A2877Fe2de80224aF4e944A2'
  let token0Address = '0x6AF3cb766D6cd37449bfD321D961A61B0515c1BC'
  let token1Address = '0xFa956eB0c4b3E692aD5a6B2f08170aDE55999ACa'
  let nftContract: Contract = await nftContractFactory.deploy(factory.address, weth9.address, nftDescripterAddress)
  nftContract = await nftContract.deployed()
  console.log(nftContract.address)
  await createPool(token0Address, token1Address, SQRT_RATIO_1_1, nftContract, 3000)

  //positionKey
  let positionKey = ethers.utils.solidityKeccak256(['address', 'int24', 'int24'], [nftContract.address, -960, 7800])
  console.log('positionKey', positionKey)
  let poolAddress = await factory.getPool(token0Address, token1Address, 3000)
  let poolContract = await ethers.getContractAt('IUniswapV3Pool', poolAddress)
  let positions = await poolContract.positions(positionKey)
  console.log('core position info', positions)

  //approve
  const TOSContract = await ethers.getContractAt('TestERC20', token0Address)
  const WTONContract = await ethers.getContractAt('TestERC20', token1Address)
  await TOSContract.approve(nftContract.address, ethers.constants.MaxUint256)
  await WTONContract.approve(nftContract.address, ethers.constants.MaxUint256)
  console.log('approved!')

  ////////////////////////////////////mint
  const mintArgs = {
    token0: token0Address,
    token1: token1Address,
    fee: 3000,
    tickLower: -960,
    tickUpper: 7800,
    amount0Desired: ethers.BigNumber.from('14539130071932514700'),
    amount1Desired: ethers.BigNumber.from('18335768707521345388'),
    amount0Min: ethers.BigNumber.from('12832429745193023361'),
    amount1Min: ethers.BigNumber.from('15865466800498285040'),
    recipient: '0xB68AA9E398c054da7EBAaA446292f611CA0CD52B',
    deadline: ethers.BigNumber.from('11963744845'),
  }
  let tx = await nftContract.mint(mintArgs)
  await tx.wait()
  let receipt = await providers.getTransactionReceipt(tx.hash)
  console.log(receipt)

  //core position info
  positions = await poolContract.positions(positionKey)
  console.log('core position info', positions)

  //get Position Info
  const balance = await nftContract.balanceOf(deployer.address)
  console.log(balance)
  const tokenId = await nftContract.tokenOfOwnerByIndex(deployer.address, balance - 1)
  console.log(tokenId.toString())
  const token = await nftContract.positions(tokenId)
  console.log(token)

  //deploy SwapRouter////////////////and swap
  const router = (await (
    await ethers.getContractFactory('MockTimeSwapRouter')
  ).deploy(factory.address, weth9.address)) as MockTimeSwapRouter
  await TOSContract.approve(router.address, ethers.constants.MaxUint256)
  await WTONContract.approve(router.address, ethers.constants.MaxUint256)
  let swapArgs = {
    tokenIn: token0Address,
    tokenOut: token1Address,
    fee: 3000,
    recipient: '0xB68AA9E398c054da7EBAaA446292f611CA0CD52B',
    deadline: ethers.BigNumber.from('11963744845'),
    amountIn: ethers.BigNumber.from('5000000000000000000'),
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  }
  tx = await router.exactInputSingle(swapArgs, { gasLimit: 3000000 })
  await tx.wait()
  receipt = await providers.getTransactionReceipt(tx.hash)
  console.log(receipt)
  //core position info
  positions = await poolContract.positions(positionKey)
  console.log('core position info', positions)
  let liquidity = (await nftContract.positions(tokenId)).liquidity
  console.log(liquidity)

  ////////////////////////decrease liquidity
  let decreaseArgs = {
    tokenId: tokenId,
    liquidity: liquidity,
    amount0Min: 0,
    amount1Min: 0,
    deadline: ethers.BigNumber.from('11963744845'),
  }
  let decreaseEncoded = nftContract.interface.encodeFunctionData('decreaseLiquidity', [decreaseArgs])
  let collectArgs = {
    tokenId: tokenId,
    recipient: deployer.address,
    amount0Max: ethers.BigNumber.from('2').pow(128).sub(1), //MaxUint128
    amount1Max: ethers.BigNumber.from('2').pow(128).sub(1),
  }
  let collectEncoded = nftContract.interface.encodeFunctionData('collect', [collectArgs])
  tx = await nftContract.multicall([decreaseEncoded, collectEncoded])
  await tx.wait()

  //core position info
  positions = await poolContract.positions(positionKey)
  console.log('core position info', positions)
  liquidity = (await nftContract.positions(tokenId)).liquidity
  console.log(liquidity)
  const token1 = await nftContract.positions(1)
  console.log(token1)

  console.log('here???')
  //////////////////////////////////increase liquidity
  let increaseArgs = {
    tokenId: tokenId,
    amount0Desired: ethers.BigNumber.from('1588045193949690290'),
    amount1Desired: ethers.BigNumber.from('1999999999999999997'),
    amount0Min: ethers.BigNumber.from('415868147396637958'),
    amount1Min: ethers.BigNumber.from('820425677566903667'),
    deadline: ethers.BigNumber.from('11963744845'),
  }
  tx = await nftContract.increaseLiquidity(increaseArgs)
  await tx.wait()

  //core position info
  positions = await poolContract.positions(positionKey)
  console.log('core position info', positions)
}

main().catch((error) => {
  console.log(error)
  process.exitCode = 1
})

async function createPool(
  token0: string,
  token1: string,
  sqrtPriceX96: BigNumberish,
  nftContract: Contract,
  fee: number = 3000
) {
  let tx = await nftContract.createAndInitializePoolIfNecessary(token0, token1, fee, sqrtPriceX96)
  await tx.wait()
  const receipt = await providers.getTransactionReceipt(tx.hash)
  console.log('createAndInitializePoolIfNecessary transactionHash:', receipt.transactionHash)
}
