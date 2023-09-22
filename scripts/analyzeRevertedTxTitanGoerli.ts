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
  console.log(factory.address)
  const SQRT_RATIO_1_1 = ethers.BigNumber.from('92979860367883423878727417014')
  await network.provider.send('hardhat_setBalance', [deployer.address, '0x10000000000000000000000000'])
  const nftContractFactory = await ethers.getContractFactory('NonfungiblePositionManager', deployer)
  const weth9 = (await waffle.deployContract(deployer, {
    bytecode: WETH9.bytecode,
    abi: WETH9.abi,
  })) as IWETH9
  let nftContract: Contract = await nftContractFactory.deploy(
    //'0x8C2351935011CfEccA4Ea08403F127FB782754AC',
    factory.address,
    weth9.address,
    '0xDC1Fa1B1F3d28E23A2877Fe2de80224aF4e944A2'
  )
  nftContract = await nftContract.deployed()
  console.log(nftContract.address)

  await createPool(
    '0x6AF3cb766D6cd37449bfD321D961A61B0515c1BC',
    '0xFa956eB0c4b3E692aD5a6B2f08170aDE55999ACa',
    SQRT_RATIO_1_1,
    nftContract,
    3000
  )

  ///core position info
  ///keccak256(abi.encodePacked(nftContract.address, -960, 7800))
  let positionKey = ethers.utils.solidityKeccak256(['address', 'int24', 'int24'], [nftContract.address, -960, 7800])
  // let positionKey = ethers.utils.keccak256(
  //   ethers.utils.defaultAbiCoder.encode(['address', 'int24', 'int24'], [nftContract.address, -960, 7800])
  // )
  console.log('positionKey', positionKey)
  let poolAddress = await factory.getPool(
    '0x6AF3cb766D6cd37449bfD321D961A61B0515c1BC',
    '0xFa956eB0c4b3E692aD5a6B2f08170aDE55999ACa',
    3000
  )
  let poolContract = await ethers.getContractAt('IUniswapV3Pool', poolAddress)
  let positions = await poolContract.positions(positionKey)
  console.log('core position info', positions)

  //approve
  const TOSContract = await ethers.getContractAt('TestERC20', '0x6AF3cb766D6cd37449bfD321D961A61B0515c1BC')
  const WTONContract = await ethers.getContractAt('TestERC20', '0xFa956eB0c4b3E692aD5a6B2f08170aDE55999ACa')
  await TOSContract.approve(nftContract.address, ethers.constants.MaxUint256)
  await WTONContract.approve(nftContract.address, ethers.constants.MaxUint256)
  console.log('approved!')

  //mint
  const mintArgs = {
    token0: '0x6AF3cb766D6cd37449bfD321D961A61B0515c1BC',
    token1: '0xFa956eB0c4b3E692aD5a6B2f08170aDE55999ACa',
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
  // await sendRawTX(
  //   '0xac9650d80000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000164883164560000000000000000000000006af3cb766d6cd37449bfd321d961a61b0515c1bc000000000000000000000000fa956eb0c4b3e692ad5a6b2f08170ade55999aca0000000000000000000000000000000000000000000000000000000000000bb8fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc400000000000000000000000000000000000000000000000000000000000001e78000000000000000000000000000000000000000000000000c9c55dc4d0bcb18c000000000000000000000000000000000000000000000000fe75bc7e0f88776c000000000000000000000000000000000000000000000000b215f2dd3762f781000000000000000000000000000000000000000000000000dc2d75ff077419f0000000000000000000000000b68aa9e398c054da7ebaaa446292f611ca0cd52b00000000000000000000000000000000000000000000000000000001750c5e4d00000000000000000000000000000000000000000000000000000000',
  //   deployer,
  //   nftContract.address,
  //   576267,
  //   0
  // )

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

  //deploy SwapRouter
  const router = (await (
    await ethers.getContractFactory('MockTimeSwapRouter')
  ).deploy(factory.address, weth9.address)) as MockTimeSwapRouter
  // const router = (await waffle.deployContract(
  //   deployer,
  //   {
  //     bytecode: SWAP_ROUTER_BYTECODE,
  //     abi: SWAP_ROUTER_ABI,
  //   },
  //   [constants.AddressZero, factory.address, nftContract.address, weth9.address]
  // )) as Contract
  console.log(router.address)
  await TOSContract.approve(router.address, ethers.constants.MaxUint256)
  await WTONContract.approve(router.address, ethers.constants.MaxUint256)
  ///Two swaps
  // await sendRawTX(
  //   '0x04e45aaf0000000000000000000000006af3cb766d6cd37449bfd321d961a61b0515c1bc000000000000000000000000fa956eb0c4b3e692ad5a6b2f08170ade55999aca0000000000000000000000000000000000000000000000000000000000000bb8000000000000000000000000b68aa9e398c054da7ebaaa446292f611ca0cd52b0000000000000000000000000000000000000000000000004563918244f4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  //   deployer,
  //   router.address,
  //   3000000,
  //   0
  // )
  let swapArgs = {
    tokenIn: '0x6AF3cb766D6cd37449bfD321D961A61B0515c1BC',
    tokenOut: '0xFa956eB0c4b3E692aD5a6B2f08170aDE55999ACa',
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
  swapArgs = {
    tokenIn: '0xFa956eB0c4b3E692aD5a6B2f08170aDE55999ACa',
    tokenOut: '0x6AF3cb766D6cd37449bfD321D961A61B0515c1BC',
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

  //collect
  await sendRawTX(
    '0xfc6f78650000000000000000000000000000000000000000000000000000000000000001000000000000000000000000b68aa9e398c054da7ebaaa446292f611ca0cd52b00000000000000000000000000000000ffffffffffffffffffffffffffffffff00000000000000000000000000000000ffffffffffffffffffffffffffffffff',
    deployer,
    nftContract.address,
    274726,
    0
  )
  //core position info
  positions = await poolContract.positions(positionKey)
  console.log('core position info', positions)

  //increase liquidity
  await sendRawTX(
    '0xac9650d800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c4219f5d1700000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000001609deb0a8a339b20000000000000000000000000000000000000000000000001bc16d674ec7fffd00000000000000000000000000000000000000000000000005c575e06ef9f5060000000000000000000000000000000000000000000000000b62bcce93fc057300000000000000000000000000000000000000000000000000000000750c5ed900000000000000000000000000000000000000000000000000000000',
    deployer,
    nftContract.address,
    600000,
    0
  )
  //core position info
  positions = await poolContract.positions(positionKey)
  console.log('core position info', positions)
  // let increaseArgs = {
  //   tokenId: tokenId,
  //   amount0Desired: ethers.BigNumber.from('1588045193949690290'),
  //   amount1Desired: ethers.BigNumber.from('1999999999999999997'),
  //   amount0Min: ethers.BigNumber.from('415868147396637958'),
  //   amount1Min: ethers.BigNumber.from('820425677566903667'),
  //   deadline: ethers.BigNumber.from('1963744985'),
  // }
  // tx = await nftContract.increaseLiquidity(increaseArgs)
  // await tx.wait()
  // receipt = await providers.getTransactionReceipt(tx.hash)
  // console.log(receipt)

  let liquidity = (await nftContract.positions(tokenId)).liquidity
  console.log(liquidity)

  ///decrease liquidity
  await sendRawTX(
    '0xac9650d80000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000224ac9650d8000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000000a40c49ccbe0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000004f6301938642f71a600000000000000000000000000000000000000000000000000000000b1294429000000000000000000000000000000000000000000000000000000e06b7e15de00000000000000000000000000000000000000000000000000000000750c5ee4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084fc6f78650000000000000000000000000000000000000000000000000000000000000001000000000000000000000000b68aa9e398c054da7ebaaa446292f611ca0cd52b00000000000000000000000000000000ffffffffffffffffffffffffffffffff00000000000000000000000000000000ffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    deployer,
    nftContract.address,
    288466,
    0
  )
  //core position info
  positions = await poolContract.positions(positionKey)
  console.log('core position info', positions)

  liquidity = (await nftContract.positions(tokenId)).liquidity
  console.log(liquidity)

  const token1 = await nftContract.positions(1)
  console.log(token1)

  //increase liquidity
  await sendRawTX(
    '0xac9650d800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c4219f5d1700000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000001609deb0a8a339b20000000000000000000000000000000000000000000000001bc16d674ec7fffd00000000000000000000000000000000000000000000000005c575e06ef9f5060000000000000000000000000000000000000000000000000b62bcce93fc057300000000000000000000000000000000000000000000000000000000750c5ed900000000000000000000000000000000000000000000000000000000',
    deployer,
    nftContract.address,
    600000,
    0
  )
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

async function sendRawTX(
  calldata: string,
  from: SignerWithAddress,
  to: string,
  gasLimit: BigNumberish,
  value: BigNumberish
) {
  const txArgs = {
    to: to,
    from: from.address,
    data: calldata,
    gasLimit: gasLimit,
    value: value,
  }
  const tx = await from.sendTransaction(txArgs)
  await tx.wait()
  //console.log(tx)
  const receipt = await providers.getTransactionReceipt(tx.hash)
  console.log(receipt)
}
