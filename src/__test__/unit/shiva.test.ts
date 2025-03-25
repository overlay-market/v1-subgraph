import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  beforeEach,
  afterEach
} from "matchstick-as/assembly/index"
import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts"

import {
  ShivaBuild as ShivaBuildEvent,
  ShivaUnwind as ShivaUnwindEvent,
} from "../../../generated/Shiva/Shiva"
import { Build as BuildEvent, Unwind as UnwindEvent } from "../../../generated/templates/OverlayV1Market/OverlayV1Market"
import { handleShivaBuild, handleShivaUnwind } from "../../shiva"
import { handleBuild, handleUnwind } from "../../mapping"
import { Build, Market } from "../../../generated/schema"
import { PERIPHERY_ADDRESS, SHIVA_ADDRESS, TRADING_MINING_ADDRESS } from "../../utils/constants"
import { setupMarketMockedFunctions, setupTradingMiningMockedFunctions } from "./shared/mockedFunctions"
import { MARKET_COLLATERAL, MARKET_POSITION_ID, MARKET_SENDER } from "./shared/constants"

const shivaAddress = Address.fromString(SHIVA_ADDRESS)
const market = Address.fromString("0x0000000000000000000000000000000000000001")
const owner = MARKET_SENDER
const performer = Address.fromString("0x0000000000000000000000000000000000000003")
const factoryAddress = Address.fromString("0x0000000000000000000000000000000000000004")
const peripheryAddress = Address.fromString(PERIPHERY_ADDRESS)
const positionId = MARKET_POSITION_ID
const brokerId = BigInt.fromI32(123)

const tmAddress = Address.fromString(TRADING_MINING_ADDRESS)
const epoch = 0
// Dummy values for testing
const collateral = MARKET_COLLATERAL
const leverage = BigInt.fromI32(10)
const fraction = BigInt.fromI32(500000000) // 0.5 in 1e18 scale
const oi = BigInt.fromI32(50)
const debt = BigInt.fromI32(20)
const price = BigInt.fromI32(100)
const oiAfterBuild = BigInt.fromI32(51)
const oiSharesAfterBuild = BigInt.fromI32(1)

describe("Shiva events", () => {
  beforeAll(() => {
    setupMarketMockedFunctions(
      factoryAddress,
      peripheryAddress,
      market
    )
    setupTradingMiningMockedFunctions(tmAddress, epoch)
  })

  describe("ShivaBuild event", () => {
    beforeEach(() => {
      const buildEvent = createBuildEvent(
        market,
        owner,
        positionId,
        oi,
        debt,
        true, // isLong
        price,
        oiAfterBuild,
        oiSharesAfterBuild
      )
      handleBuild(buildEvent)

      // Create and handle ShivaBuild event
      const shivaBuildEvent = createShivaBuildEvent(
        market,
        owner,
        performer,
        positionId,
        collateral,
        leverage,
        brokerId,
        true // isLong
      )
      handleShivaBuild(shivaBuildEvent)
    })

    afterEach(() => {
      clearStore()
    })

    test("updates Build entity with router params", () => {
      const buildId = market.toHexString().concat('-').concat(positionId.toHexString())
      const routerParamsId = shivaAddress.concat(Bytes.fromUTF8(buildId)).toHexString()
      assert.fieldEquals("Build", buildId, "routerParams", routerParamsId)
    })

    test("creates RouterParams entity with correct attributes", () => {
      const buildId = market.toHexString().concat('-').concat(positionId.toHexString())
      const routerParamsId = shivaAddress.concat(Bytes.fromUTF8(buildId)).toHexString()

      assert.entityCount("RouterParams", 1)
      assert.fieldEquals("RouterParams", routerParamsId, "brokerId", brokerId.toString())
      assert.fieldEquals("RouterParams", routerParamsId, "performer", performer.toHexString())
      assert.fieldEquals("RouterParams", routerParamsId, "router", shivaAddress.toHexString())
    })

    test("updates Position entity with router", () => {
      const positionIdd = market.toHexString().concat('-').concat(positionId.toHexString())
      
      assert.fieldEquals("Position", positionIdd, "router", shivaAddress.toHexString())
      assert.fieldEquals("Position", positionIdd, "owner", owner.toHexString())
    })
  })

  describe("ShivaUnwind event", () => {
    beforeEach(() => {
      // Create Build event to setup initial position
      const buildEvent = createBuildEvent(
        market,
        owner,
        positionId,
        oi,
        debt,
        true,
        price,
        oiAfterBuild,
        oiSharesAfterBuild
      )
      handleBuild(buildEvent)

      // Create Unwind event
      const unwindEvent = createUnwindEvent(
        market,
        owner,
        positionId,
        fraction,
        BigInt.fromI32(0), // mint
        price,
        oi.div(BigInt.fromI32(2)), // oiAfterUnwind
        oiSharesAfterBuild
      )
      handleUnwind(unwindEvent)

      // Create and handle ShivaUnwind event
      const shivaUnwindEvent = createShivaUnwindEvent(
        market,
        owner,
        performer,
        positionId,
        fraction,
        brokerId
      )
      handleShivaUnwind(shivaUnwindEvent)
    })

    afterEach(() => {
      clearStore()
    })

    test("updates Unwind entity with router params", () => {
      const unwindId = market.toHexString()
        .concat('-')
        .concat(positionId.toHexString())
        .concat('-0')

      log.debug("Unwind id in test: {}", [unwindId])
      const routerParamsId = shivaAddress.concat(Bytes.fromUTF8(unwindId)).toHexString()

      assert.fieldEquals("Unwind", unwindId, "routerParams", routerParamsId)
    })

    test("creates RouterParams entity with correct attributes", () => {
      const unwindId = market.toHexString()
        .concat('-')
        .concat(positionId.toHexString())
        .concat('-0')
      const routerParamsId = shivaAddress.concat(Bytes.fromUTF8(unwindId)).toHexString()

      assert.entityCount("RouterParams", 1)
      assert.fieldEquals("RouterParams", routerParamsId, "brokerId", brokerId.toString())
      assert.fieldEquals("RouterParams", routerParamsId, "performer", performer.toHexString())
      assert.fieldEquals("RouterParams", routerParamsId, "router", shivaAddress.toHexString())
    })
  })
})

function createBuildEvent(
  market: Address,
  sender: Address,
  positionId: BigInt,
  oi: BigInt,
  debt: BigInt,
  isLong: boolean,
  price: BigInt,
  oiAfterBuild: BigInt,
  oiSharesAfterBuild: BigInt
): BuildEvent {
  const event = changetype<BuildEvent>(newMockEvent())
  
  event.address = market
  event.parameters = [
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender)),
    new ethereum.EventParam("positionId", ethereum.Value.fromUnsignedBigInt(positionId)),
    new ethereum.EventParam("oi", ethereum.Value.fromUnsignedBigInt(oi)),
    new ethereum.EventParam("debt", ethereum.Value.fromUnsignedBigInt(debt)),
    new ethereum.EventParam("isLong", ethereum.Value.fromBoolean(isLong)),
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price)),
    new ethereum.EventParam("oiAfterBuild", ethereum.Value.fromUnsignedBigInt(oiAfterBuild)),
    new ethereum.EventParam("oiSharesAfterBuild", ethereum.Value.fromUnsignedBigInt(oiSharesAfterBuild))
  ]

  return event
}

function createUnwindEvent(
  market: Address,
  sender: Address,
  positionId: BigInt,
  fraction: BigInt,
  mint: BigInt,
  price: BigInt,
  oiAfterUnwind: BigInt,
  oiSharesAfterUnwind: BigInt
): UnwindEvent {
  const event = changetype<UnwindEvent>(newMockEvent())
  
  event.address = market
  event.parameters = [
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender)),
    new ethereum.EventParam("positionId", ethereum.Value.fromUnsignedBigInt(positionId)),
    new ethereum.EventParam("fraction", ethereum.Value.fromUnsignedBigInt(fraction)),
    new ethereum.EventParam("mint", ethereum.Value.fromUnsignedBigInt(mint)),
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price)),
    new ethereum.EventParam("oiAfterUnwind", ethereum.Value.fromUnsignedBigInt(oiAfterUnwind)),
    new ethereum.EventParam("oiSharesAfterUnwind", ethereum.Value.fromUnsignedBigInt(oiSharesAfterUnwind))
  ]

  return event
}

function createShivaBuildEvent(
  market: Address,
  owner: Address,
  performer: Address,
  positionId: BigInt,
  collateral: BigInt,
  leverage: BigInt,
  brokerId: BigInt,
  isLong: boolean
): ShivaBuildEvent {
  const event = changetype<ShivaBuildEvent>(newMockEvent())
  
  event.parameters = [
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner)),
    new ethereum.EventParam("market", ethereum.Value.fromAddress(market)),
    new ethereum.EventParam("performer", ethereum.Value.fromAddress(performer)),
    new ethereum.EventParam("positionId", ethereum.Value.fromUnsignedBigInt(positionId)),
    new ethereum.EventParam("collateral", ethereum.Value.fromUnsignedBigInt(collateral)),
    new ethereum.EventParam("leverage", ethereum.Value.fromUnsignedBigInt(leverage)),
    new ethereum.EventParam("brokerId", ethereum.Value.fromUnsignedBigInt(brokerId)),
    new ethereum.EventParam("isLong", ethereum.Value.fromBoolean(isLong))
  ]

  return event
}

function createShivaUnwindEvent(
  market: Address,
  owner: Address,
  performer: Address,
  positionId: BigInt,
  fraction: BigInt,
  brokerId: BigInt
): ShivaUnwindEvent {
  const event = changetype<ShivaUnwindEvent>(newMockEvent())
  
  event.parameters = [
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner)),
    new ethereum.EventParam("market", ethereum.Value.fromAddress(market)),
    new ethereum.EventParam("performer", ethereum.Value.fromAddress(performer)),
    new ethereum.EventParam("positionId", ethereum.Value.fromUnsignedBigInt(positionId)),
    new ethereum.EventParam("fraction", ethereum.Value.fromUnsignedBigInt(fraction)),
    new ethereum.EventParam("brokerId", ethereum.Value.fromUnsignedBigInt(brokerId))
  ]

  return event
}