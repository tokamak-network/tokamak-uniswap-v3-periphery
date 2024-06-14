// Copyright 2024 justin
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import fs from 'fs'
import hre from 'hardhat'
const run = hre.run
const chainName = hre.network.name

let data = JSON.parse(fs.readFileSync(`../state.${chainName}.json`).toString())

const main = async () => {
  console.log('Verifying contract...')
  try {
    await run('verify:verify', {
      address: data['nonfungibleTokenPositionManagerAddress'],
      constructorArguments: [
        data['v3CoreFactoryAddress'],
        '0x4200000000000000000000000000000000000006',
        data['descriptorProxyAddress'],
      ],
    })
    await run('verify:verify', {
       address: data['nftDescriptorLibraryAddress'],
       constructorArguments: [],
    })
    const _nativeCurrencyLabelBytes = asciiStringToBytes32('TON')
    await run('verify:verify', {
      address: data['nonfungibleTokenPositionDescriptorAddress'],
      constructorArguments: ['0x4200000000000000000000000000000000000006', _nativeCurrencyLabelBytes],
    })
    await run('verify:verify', {
      address: data['tickLensAddress'],
      constructorArguments: [],
    })
    await run('verify:verify', {
      address: data['multicall2Address'],
      constructorArguments: [],
    })
  } catch (e) {
    if ((e as any).message.toLowerCase().includes('already verified')) {
      console.log('Already verified!')
    } else {
      console.log(e)
    }
  }
}

export function isAscii(str: string): boolean {
  return /^[\x00-\x7F]*$/.test(str)
}

export function asciiStringToBytes32(str: string): string {
  if (str.length > 32 || !isAscii(str)) {
    throw new Error('Invalid label, must be less than 32 characters')
  }

  return '0x' + Buffer.from(str, 'ascii').toString('hex').padEnd(64, '0')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
