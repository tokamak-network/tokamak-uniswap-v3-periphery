import hre from 'hardhat'
import fs from 'fs'
const run = hre.run
const chainName = hre.network.name

let data = JSON.parse(fs.readFileSync(`deployed.uniswap.${chainName}.json`).toString())

const main = async () => {
  console.log('Verifying contract...')
  try {
    await run('verify', {
      address: data['NonfungiblePositionManager'],
      constructorArgsParams: [
        data['UniswapV3Factory'],
        '0x4200000000000000000000000000000000000006',
        data['NonfungibleTokenPositionDescriptor'],
      ],
    })
    await run('verify', {
      address: data['SwapRouter'],
      constructorArgsParams: [data['UniswapV3Factory'], '0x4200000000000000000000000000000000000006'],
    })
    await run('verify', {
      address: data['NFTDescriptor'],
      constructorArgsParams: [],
    })
    await run('verify', {
      address: data['NonfungibleTokenPositionDescriptor'],
      constructorArgsParams: [
        '0x4200000000000000000000000000000000000006',
        '0xaaaebeba3810b1e6b70781f14b2d72c1cb89c0b2b320c43bb67ff79f562f5ff4',
      ],
    })
    await run('verify', {
      address: data['Quoter'],
      constructorArgsParams: [data['UniswapV3Factory'], '0x4200000000000000000000000000000000000006'],
    })
    await run('verify', {
      address: data['QuoterV2'],
      constructorArgsParams: [data['UniswapV3Factory'], '0x4200000000000000000000000000000000000006'],
    })
    await run('verify', {
      address: data['TickLens'],
      constructorArgsParams: [],
    })
    await run('verify', {
      address: data['UniswapInterfaceMulticall'],
      constructorArgsParams: [],
    })
  } catch (e: any) {
    if (e.message.toLowerCase().includes('already verified')) {
      console.log('Already verified!')
    } else {
      console.log(e)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
