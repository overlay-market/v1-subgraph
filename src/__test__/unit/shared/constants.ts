import { Address, BigInt } from "@graphprotocol/graph-ts"

const MARKET_COLLATERAL = BigInt.fromI32(1000)
const MARKET_POSITION_ID = BigInt.fromI32(1)
const MARKET_PCD_HOLDER = Address.fromString("0x000000000000000000000000000000000000ca1e")
const MARKET_SENDER = Address.fromString("0x0000000000000000000000000000000000000b0b")

export { MARKET_COLLATERAL, MARKET_POSITION_ID, MARKET_PCD_HOLDER, MARKET_SENDER }