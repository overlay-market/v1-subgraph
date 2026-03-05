// Auto-generated config for network: bsc
// Generated on: 2026-03-05T14:10:55.484Z
// To change, add, or remove constants, look at scripts/switchNetwork.js

export const FACTORY_ADDRESSES: Array<string> = ['0xC35093f76fF3D31Af27A893CDcec585F1899eE54', '0x17D4F2ea0c3227FB6b31ADA99265E41f3369150A', '0x5e6613da86099c264ef9cd56c142506bbf642825']
export const PERIPHERY_ADDRESSES: Array<string> = ['0x10575a9C8F36F9F42D7DB71Ef179eD9BEf8Df238', '0x9C52f7107efBe6e0010E924a0B53265ba4e8959d', '0x6fecbf42b2dcf4bfd3c1c60dcd956247f4abd35e']
export const FACTORY_ADDRESS = FACTORY_ADDRESSES[0]

export function getPeripheryAddressForFactory(factoryAddress: string): string {
    let lookup = factoryAddress.toLowerCase()
    for (let i = 0; i < FACTORY_ADDRESSES.length; i++) {
        if (FACTORY_ADDRESSES[i].toLowerCase() == lookup) {
            return PERIPHERY_ADDRESSES[i]
        }
    }
    return PERIPHERY_ADDRESSES[0]
}
export const OVL_ADDRESS = '0x1F34c87ded863Fe3A3Cd76FAc8adA9608137C8c3'
export const REFERRAL_ADDRESS = '0xd36a37a5c116ef661a84bd2314b4ef59e1a0f307'
export const TRADING_MINING_ADDRESS = '0x0000000000000000000000000000000000000000'
export const SHIVA_ADDRESS = '0xeB497c228F130BD91E7F13f81c312243961d894A'
