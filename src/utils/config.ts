// Auto-generated config for network: chapel
// Generated on: 2025-10-02T16:02:16.617Z
// To change, add, or remove constants, look at scripts/switchNetwork.js

export const FACTORY_ADDRESSES: Array<string> = ['0xC35093f76fF3D31Af27A893CDcec585F1899eE54', '0x73ed124e6426e81cac4becae2720e19ce5836f45']
export const PERIPHERY_ADDRESSES: Array<string> = ['0x10575a9C8F36F9F42D7DB71Ef179eD9BEf8Df238', '0xb5A2FaCa54082758EE78eA7022EE178c4F909A80']
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
export const REFERRAL_ADDRESS = '0x1a0ef183d548405705bb9b00e8b4ef3524ae090e'
export const TRADING_MINING_ADDRESS = '0x0000000000000000000000000000000000000000'
export const SHIVA_ADDRESS = '0xeB497c228F130BD91E7F13f81c312243961d894A'
