/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { OverlayV1Factory as FactoryContract } from '../../generated/OverlayV1Factory/OverlayV1Factory'
import { OverlayV1PositionState as PositionStateContract } from '../../generated/OverlayV1Factory/OverlayV1PositionState'

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'
export const FACTORY_ADDRESS = '0x8cCD181113c7Ae40f31D5e8178a98A1A60B55c4C'
export const PERIPHERY_ADDRESS = '0x96079957e7eAEb2B9810E8FB0027B3553d86a719'

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let BI_18 = BigInt.fromI32(18)

export let factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS))
export let positionStateContract = PositionStateContract.bind(Address.fromString(PERIPHERY_ADDRESS))