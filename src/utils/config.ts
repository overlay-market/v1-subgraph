// Auto-generated config for network: chapel
// Generated on: 2025-11-18T14:04:39.357Z
// To change, add, or remove constants, look at scripts/switchNetwork.js

export const FACTORY_ADDRESSES: Array<string> = ['0x222Ef39b61f868992F77bd68Fc9d7c82683ffA20', '0xb5F885b61e2cC1515a66A2E6636FCAA43daBf044']
export const PERIPHERY_ADDRESSES: Array<string> = ['0x6C57F1d360027c10b3b698b302120DaD31CB34c9', '0x3A6892e5da2f87F3865aA1aEA2fcaCCE27C44ea8']
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
export const OVL_ADDRESS = '0x1A0eF183D548405705bb9B00E8b4ef3524AE090E'
export const REFERRAL_ADDRESS = '0x0000000000000000000000000000000000000000'
export const TRADING_MINING_ADDRESS = '0x0000000000000000000000000000000000000000'
export const SHIVA_ADDRESS = '0x9fB7D92526Fc13bB3c0603d39E55e5C371c26Ce6'
