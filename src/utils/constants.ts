/* eslint-disable prefer-const */
import { Bytes, BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { OverlayV1Factory as FactoryContract } from '../../generated/OverlayV1Factory/OverlayV1Factory'
import { OverlayV1State as StateContract } from '../../generated/OverlayV1Factory/OverlayV1State'

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export const FACTORY_ADDRESS = '0xb136c8f0ea9d1c3f676f91feacea8bf967fda7d0' // movement-testnet
export const PERIPHERY_ADDRESS = '0x0ca6128b528f503c7c649ba9cc02560a8b9fd55e' // movement-testnet
export const OVL_ADDRESS = '0xcde46284d32148c4d470fa33ba788710b3d21e89' // movement-testnet
export const REFERRAL_ADDRESS = '0x1cee53AB89004b2a9E173edc6F51509f8eB32122' // not deployed on movement
export const TRADING_MINING_ADDRESS = '0xFDf98Ac225Aa3B2788dcE96ffe55C2Bb3edCf4c9' // not deployed on movement-testnet

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