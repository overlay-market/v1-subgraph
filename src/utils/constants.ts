/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { OverlayV1Factory as FactoryContract } from '../../generated/OverlayV1Factory/OverlayV1Factory'
import { OverlayV1State as StateContract } from '../../generated/OverlayV1Factory/OverlayV1State'

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export const FACTORY_ADDRESS = '0xc10e8E06b1b8DADB8E94120650414AFfedD17aF9'
export const PERIPHERY_ADDRESS = '0x06C76062730aD18aBdc3C9198b3EB283f7bb3627'
// periphery deployed on kovan block 32456647

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let BI_18 = BigInt.fromI32(18)

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