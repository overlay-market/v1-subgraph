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
    RewardTokensUpdated as RewardTokensUpdatedEvent,    
} from "../../../generated/TradingMining/TradingMining"
import { handleRewardTokensUpdated } from "../../trading-mining"

// Export handlers for coverage report
export { handleRewardTokensUpdated }

const tradingMining = Address.fromString("0x0000000000000000000000000000000000000001")
const rewardToken2 = Address.fromString("0x0000000000000000000000000000000000000002")
const token1Percentage = BigInt.fromI32(100)

describe("Reward tokens updated event", () => {

    // Mock TradingMining contract with dummy values
    beforeAll(() => {
        createMockedFunction(tradingMining, "rewardToken1", "rewardToken1():(address)")
            .returns([ethereum.Value.fromAddress(Address.zero())])

        createMockedFunction(tradingMining, "rewardToken2", "rewardToken2():(address)")
            .returns([ethereum.Value.fromAddress(rewardToken2)])

        createMockedFunction(tradingMining, "token1Percentage", "token1Percentage():(uint8)")
            .returns([ethereum.Value.fromUnsignedBigInt(token1Percentage)])

        createMockedFunction(tradingMining, "startTime", "startTime():(uint64)")
            .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0))])

        createMockedFunction(tradingMining, "epochDuration", "epochDuration():(uint64)")
            .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0))])

        createMockedFunction(tradingMining, "pcdHolderBonusPercentage", "pcdHolderBonusPercentage():(uint8)")
            .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0))])

        createMockedFunction(tradingMining, "maxRewardPerEpochPerAddress", "maxRewardPerEpochPerAddress():(uint256)")
            .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0))])
    })

    beforeEach(() => {
        const event = createRewardTokensUpdatedEvent(tradingMining, rewardToken2, token1Percentage)
        handleRewardTokensUpdated(event)
    })

    afterEach(() => {
        clearStore()
    })

    test("creates TradingMining entity", () => {
        assert.entityCount("TradingMining", 1)
    })

    test("updates TradingMining entity", () => {
        assert.fieldEquals("TradingMining", tradingMining.toHexString(),
            "rewardToken2",
            rewardToken2.toHexString()
        )

        assert.fieldEquals("TradingMining", tradingMining.toHexString(),
            "token1Percentage",
            token1Percentage.toString()
        )
    })

})

function createRewardTokensUpdatedEvent(
    tradingMining: Address,
    rewardToken2: Address,
    token1Percentage: BigInt
): RewardTokensUpdatedEvent {
    const event = changetype<RewardTokensUpdatedEvent>(newMockEvent())

    event.address = tradingMining
    event.parameters = new Array()

    event.parameters.push(
        new ethereum.EventParam("rewardToken2", ethereum.Value.fromAddress(rewardToken2))
    )

    event.parameters.push(
        new ethereum.EventParam("token1Percentage", ethereum.Value.fromUnsignedBigInt(token1Percentage))
    )

    return event
}
