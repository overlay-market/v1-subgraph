import {
    assert,
    describe,
    test,
    clearStore,
    beforeAll,
    beforeEach,
    afterEach,
    createMockedFunction
} from "matchstick-as/assembly/index"
import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"

import {
    Build as BuildEvent,
} from "../../../generated/templates/OverlayV1Market/OverlayV1Market"
import { handleBuild } from "../../mapping"
import { PERIPHERY_ADDRESS, TRADING_MINING_ADDRESS, ZERO_BI } from "../../utils/constants"
import { Account, TradingMining } from "../../../generated/schema"

// Export handlers for coverage report
export { handleBuild }

const market = Address.fromString("0x0000000000000000000000000000000000000001")
const tmAddress = Address.fromString(TRADING_MINING_ADDRESS)

// Build event parameters
const sender = Address.fromString("0x0000000000000000000000000000000000000b0b")
const pcdHolder = Address.fromString("0x000000000000000000000000000000000000ca1e")
const positionId = BigInt.fromI32(1)
const oi = BigInt.fromI32(50)
const debt = BigInt.fromI32(20)
const isLong = true
const price = BigInt.fromI32(100)
const collateral = BigInt.fromI32(1000)

// Trading mining parameters
const epoch = 0

describe("Market events", () => {

    // Mock contract calls with dummy values
    beforeAll(() => {
        // Market contract
        createMockedFunction(market, "feed", "feed():(address)")
            .returns([ethereum.Value.fromAddress(Address.zero())])
        createMockedFunction(market, "factory", "factory():(address)")
            .returns([ethereum.Value.fromAddress(Address.zero())])
        for (let i = 0; i < 15; i++) {
            createMockedFunction(market, "params", "params(uint256):(uint256)")
                .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(i))])
                .returns([ethereum.Value.fromI32(1)])
        }

        // Periphery contract
        createMockedFunction(Address.fromString(PERIPHERY_ADDRESS), "ois", "ois(address):(uint256,uint256)")
            .withArgs([ethereum.Value.fromAddress(market)])
            .returns([ethereum.Value.fromI32(1), ethereum.Value.fromI32(1)])
        createMockedFunction(Address.fromString(PERIPHERY_ADDRESS), "cost", "cost(address,address,uint256):(uint256)")
            .withArgs([ethereum.Value.fromAddress(market), ethereum.Value.fromAddress(sender), ethereum.Value.fromUnsignedBigInt(positionId)])
            .returns([ethereum.Value.fromUnsignedBigInt(collateral)])
        createMockedFunction(Address.fromString(PERIPHERY_ADDRESS), "value", "value(address,address,uint256):(uint256)")
            .withArgs([ethereum.Value.fromAddress(market), ethereum.Value.fromAddress(sender), ethereum.Value.fromUnsignedBigInt(positionId)])
            .returns([ethereum.Value.fromI32(1)])
        createMockedFunction(Address.fromString(PERIPHERY_ADDRESS), "cost", "cost(address,address,uint256):(uint256)")
            .withArgs([ethereum.Value.fromAddress(market), ethereum.Value.fromAddress(pcdHolder), ethereum.Value.fromUnsignedBigInt(positionId)])
            .returns([ethereum.Value.fromUnsignedBigInt(collateral)])
        createMockedFunction(Address.fromString(PERIPHERY_ADDRESS), "value", "value(address,address,uint256):(uint256)")
            .withArgs([ethereum.Value.fromAddress(market), ethereum.Value.fromAddress(pcdHolder), ethereum.Value.fromUnsignedBigInt(positionId)])
            .returns([ethereum.Value.fromI32(1)])
        
        // TradingMining contract
        createMockedFunction(tmAddress, "getCurrentEpoch", "getCurrentEpoch():(uint256)")
            .returns([ethereum.Value.fromI32(epoch)])
    })

    describe("Build event", () => {

        beforeEach(() => {
            const event = createBuildEvent(market, sender, positionId, oi, debt, isLong, price)
            handleBuild(event)
        })
    
        afterEach(() => {
            clearStore()
        })

        test("creates Market entity", () => {
            assert.entityCount("Market", 1)
        })

        describe("Trading Mining", () => {

            test("creates TradingMiningEpochVolume entity", () => {
                assert.entityCount("TradingMiningEpochVolume", 1)
            })

            test("updates trader's epoch volume", () => {
                assert.fieldEquals("TradingMiningEpochVolume", tmAddress.concat(sender).concatI32(epoch).toHexString(),
                    "volume",
                    collateral.plus(debt).toString()
                )
            })

            test("bonus for PCD holders", () => {
                const bonus = 10

                // Create PCD holder account
                const account = new Account(pcdHolder.toHexString())
                account.planckCatBalance = BigInt.fromI32(1)
                account.realizedPnl = ZERO_BI
                account.numberOfUnwinds = ZERO_BI
                account.numberOfOpenPositions = ZERO_BI
                account.numberOfLiquidatedPositions = ZERO_BI
                account.save()

                // Set bonus percentage in TradingMining entity
                const tradingMining = new TradingMining(tmAddress)
                tradingMining.pcdHolderBonusPercentage = bonus
                tradingMining.rewardToken1 = Address.zero()
                tradingMining.rewardToken2 = Address.zero()
                tradingMining.token1Percentage = 0
                tradingMining.startTime = ZERO_BI
                tradingMining.epochDuration = ZERO_BI
                tradingMining.maxRewardPerEpochPerAddress = ZERO_BI
                tradingMining.totalRewards = ZERO_BI
                tradingMining.save()

                // Create Build event with PCD holder as sender
                const event = createBuildEvent(market, pcdHolder, positionId, oi, debt, isLong, price)
                handleBuild(event)

                const volume = collateral.plus(debt)

                assert.fieldEquals("TradingMiningEpochVolume", tmAddress.concat(pcdHolder).concatI32(epoch).toHexString(),
                    "volume",
                    volume.plus(volume.times(BigInt.fromI32(bonus)).div(BigInt.fromI32(100))).toString()
                )
            })

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
    price: BigInt
): BuildEvent {
    const event = changetype<BuildEvent>(newMockEvent())

    event.address = market
    event.parameters = new Array()

    event.parameters.push(
        new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
    )

    event.parameters.push(
        new ethereum.EventParam("positionId", ethereum.Value.fromUnsignedBigInt(positionId))
    )

    event.parameters.push(
        new ethereum.EventParam("oi", ethereum.Value.fromUnsignedBigInt(oi))
    )

    event.parameters.push(
        new ethereum.EventParam("debt", ethereum.Value.fromUnsignedBigInt(debt))
    )

    event.parameters.push(
        new ethereum.EventParam("isLong", ethereum.Value.fromBoolean(isLong))
    )

    event.parameters.push(
        new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
    )

    return event
}
