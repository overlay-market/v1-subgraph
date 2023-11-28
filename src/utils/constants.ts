/* eslint-disable prefer-const */
import { ethereum, Bytes, BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { OverlayV1Factory as FactoryContract } from '../../generated/OverlayV1Factory/OverlayV1Factory'
import { OverlayV1State as StateContract } from '../../generated/OverlayV1Factory/OverlayV1State'

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export const FACTORY_ADDRESS = '0xa2dbe262d27647243ac3187d05dbf6c3c6ecc14d' // arbitrum-sepolia
export const PERIPHERY_ADDRESS = '0x2878837EA173e8BD40Db7CEE360b15c1C27dEB5A' // arbitrum-sepolia
export const OVL_ADDRESS = '0x3E27fAe625f25291bFda517f74bf41DC40721dA2' // arb
export const REFERRAL_ADDRESS = '0x426cB483cad253aa7E514c6C2B76a3c215d9065b'

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ONE_18DEC_BI = BigInt.fromString('1000000000000000000')
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let BI_18 = BigInt.fromI32(18)
export let BPS_BASE_BI = BigInt.fromString('10000')

export let factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS))
export let stateContract = StateContract.bind(Address.fromString(PERIPHERY_ADDRESS))

export enum RISK_PARAMS {
  k = 0,
  lmbda = 1,
  delta = 2,
  capPayoff = 3,
  capNotional = 4,
  capLeverage = 5,
  circuitBreakerWindow = 6,
  circuitBreakerMintTarget = 7,
  maintenanceMarginFraction = 8,
  maintenanceMarginBurnRate = 9,
  liquidationFeeRate = 10,
  tradingFeeRate = 11,
  minCollateral = 12,
  priceDriftUpperLimit = 13,
  averageBlockTime = 14
}

export const TRANSFER_SIG: Bytes = Bytes.fromHexString(
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // This is identifier of the Transfer
  )
