/* eslint-disable prefer-const */
import { ethereum, Bytes, BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { OverlayV1Factory as FactoryContract } from '../../generated/OverlayV1Factory/OverlayV1Factory'
import { OverlayV1State as StateContract } from '../../generated/OverlayV1Factory/OverlayV1State'

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
// export const FACTORY_ADDRESS = '0x9a74758c2A80fA1B1d899E0E1f24CF505a4Dea33' // ethereum
export const FACTORY_ADDRESS = '0xfa39cde07ff63b4329a70784c0600da38cf4777c' // arbitrum
// export const PERIPHERY_ADDRESS = '0x477122219aa1F76E190f480a85af97DE0A643320' // ethereum
export const PERIPHERY_ADDRESS = '0xc3cb99652111e7828f38544e3e94c714d8f9a51a' // arbitrum
// periphery deployed on mainnet block 15626703

export const OVL_ADDRESS = '0x4305c4bc521b052f17d389c2fe9d37cabeb70d54' // arb
// export const OVL_ADDRESS = '0xdc77aCC82ccE1Cc095CbA197474Cc06824adE6F7' // eth

export const REFERRAL_ADDRESS = '0x0000000000000000000000000000000000000000'

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ONE_18DEC_BI = BigInt.fromString('1000000000000000000')
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

export const TRANSFER_SIG: Bytes = Bytes.fromHexString(
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // This is identifier of the Transfer
  )
