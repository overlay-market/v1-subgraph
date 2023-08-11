import {
    assert,
    describe,
    test,
    clearStore,
    beforeAll,
    beforeEach,
    createMockedFunction
} from "matchstick-as/assembly/index"
import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"

import {
    RewardTokensDepositedByAdmin as RewardTokensDepositedByAdminEvent,
    RewardTokensWithdrawnByAdmin as RewardTokensWithdrawnByAdminEvent,
    RewardsClaimed as RewardsClaimedEvent,
    TokensStaked as TokensStakedEvent,
    TokensWithdrawn as TokensWithdrawnEvent,
    UpdatedRewardRatio as UpdatedRewardRatioEvent,
    UpdatedTimeUnit as UpdatedTimeUnitEvent,
} from '../../../generated/TokenStake/TokenStake'
import {
    handleRewardTokensDepositedByAdmin,
    handleRewardTokensWithdrawnByAdmin,
    handleRewardsClaimed,
    handleTokensStaked,
    handleTokensWithdrawn,
    handleUpdatedRewardRatio,
    handleUpdatedTimeUnit,
} from "../../token-stake"

// Export handlers for coverage report
export {
    handleRewardTokensDepositedByAdmin,
    handleRewardTokensWithdrawnByAdmin,
    handleRewardsClaimed,
    handleTokensStaked,
    handleTokensWithdrawn,
    handleUpdatedRewardRatio,
    handleUpdatedTimeUnit,
}

const address = Address.fromString("0x0000000000000000000000000000000000000001")
const rewardToken = Address.fromString("0x0000000000000000000000000000000000000002")
const stakingToken = Address.fromString("0x0000000000000000000000000000000000000003")
const ratioNumerator = BigInt.fromI32(1)
const ratioDenominator = BigInt.fromI32(10)
const timeUnit = BigInt.fromI32(86400)
const stakedBalance = BigInt.fromI32(0)
const rewardsBalance = BigInt.fromI32(0)
const totalRewardsClaimed = BigInt.fromI32(0)
const staker = Address.fromString("0x0000000000000000000000000000000000000004")
const amount = BigInt.fromI32(100)

describe("Token stake events", () => {
    beforeAll(() => {
        createMockedFunction(address, "rewardToken", "rewardToken():(address)")
            .returns([ethereum.Value.fromAddress(rewardToken)])
        createMockedFunction(address, "stakingToken", "stakingToken():(address)")
            .returns([ethereum.Value.fromAddress(stakingToken)])
        createMockedFunction(address, "getRewardRatio", "getRewardRatio():(uint256,uint256)")
            .returns([
                ethereum.Value.fromUnsignedBigInt(ratioNumerator),
                ethereum.Value.fromUnsignedBigInt(ratioDenominator),
            ])
        createMockedFunction(address, "getTimeUnit", "getTimeUnit():(uint256)")
            .returns([ethereum.Value.fromUnsignedBigInt(timeUnit)])
        createMockedFunction(address, "stakingTokenBalance", "stakingTokenBalance():(uint256)")
            .returns([ethereum.Value.fromUnsignedBigInt(stakedBalance)])
        createMockedFunction(address, "getRewardTokenBalance", "getRewardTokenBalance():(uint256)")
            .returns([ethereum.Value.fromUnsignedBigInt(rewardsBalance)])
    })

    describe("RewardTokensDepositedByAdmin event", () => {
        beforeEach(() => {
            clearStore()
            const event = createRewardTokensDepositedByAdminEvent(address, amount)
            handleRewardTokensDepositedByAdmin(event)
        })

        test("creates StakingContract entity and updates rewards balance", () => {
            assert.entityCount("Staking", 1)
            const id = address.toHexString()

            assert.fieldEquals("Staking", id,
                "rewardToken",
                rewardToken.toHexString()
            )
            assert.fieldEquals("Staking", id,
                "stakingToken",
                stakingToken.toHexString()
            )
            assert.fieldEquals("Staking", id,
                "rewardRatioNumerator",
                ratioNumerator.toString()
            )
            assert.fieldEquals("Staking", id,
                "rewardRatioDenominator",
                ratioDenominator.toString()
            )
            assert.fieldEquals("Staking", id,
                "timeUnit",
                timeUnit.toString()
            )
            assert.fieldEquals("Staking", id,
                "stakedBalance",
                stakedBalance.toString()
            )
            assert.fieldEquals("Staking", id,
                "rewardsBalance",
                rewardsBalance.plus(amount).toString()
            )
            assert.fieldEquals("Staking", id,
                "totalRewardsClaimed",
                totalRewardsClaimed.toString()
            )
        })
    })

    describe("RewardTokensWithdrawnByAdmin event", () => {
        beforeEach(() => {
            clearStore()
            const event = createRewardTokensWithdrawnByAdminEvent(address, amount)
            handleRewardTokensWithdrawnByAdmin(event)
        })

        test("creates StakingContract entity and updates rewards balance", () => {
            assert.entityCount("Staking", 1)
            const id = address.toHexString()

            assert.fieldEquals("Staking", id,
                "rewardToken",
                rewardToken.toHexString()
            )
            assert.fieldEquals("Staking", id,
                "stakingToken",
                stakingToken.toHexString()
            )
            assert.fieldEquals("Staking", id,
                "rewardRatioNumerator",
                ratioNumerator.toString()
            )
            assert.fieldEquals("Staking", id,
                "rewardRatioDenominator",
                ratioDenominator.toString()
            )
            assert.fieldEquals("Staking", id,
                "timeUnit",
                timeUnit.toString()
            )
            assert.fieldEquals("Staking", id,
                "stakedBalance",
                stakedBalance.toString()
            )
            assert.fieldEquals("Staking", id,
                "rewardsBalance",
                rewardsBalance.minus(amount).toString()
            )
            assert.fieldEquals("Staking", id,
                "totalRewardsClaimed",
                totalRewardsClaimed.toString()
            )
        })
    })

    describe("RewardsClaimed event", () => {
        beforeEach(() => {
            clearStore()
            const event = createRewardsClaimedEvent(address, staker, amount)
            handleRewardsClaimed(event)
        })

        test("creates StakingContract entity and updates rewards balances", () => {
            assert.entityCount("Staking", 1)
            const id = address.toHexString()

            assert.fieldEquals("Staking", id,
                "rewardToken",
                rewardToken.toHexString()
            )
            assert.fieldEquals("Staking", id,
                "stakingToken",
                stakingToken.toHexString()
            )
            assert.fieldEquals("Staking", id,
                "rewardRatioNumerator",
                ratioNumerator.toString()
            )
            assert.fieldEquals("Staking", id,
                "rewardRatioDenominator",
                ratioDenominator.toString()
            )
            assert.fieldEquals("Staking", id,
                "timeUnit",
                timeUnit.toString()
            )
            assert.fieldEquals("Staking", id,
                "stakedBalance",
                stakedBalance.toString()
            )
            assert.fieldEquals("Staking", id,
                "rewardsBalance",
                rewardsBalance.minus(amount).toString()
            )
            assert.fieldEquals("Staking", id,
                "totalRewardsClaimed",
                totalRewardsClaimed.plus(amount).toString()
            )
        })

        test("creates StakingPosition entity and updates rewards claimed", () => {
            assert.entityCount("StakingPosition", 1)
            const id = address.concat(staker).toHexString()

            // Staker account should exist
            assert.entityCount("Account", 1)

            assert.fieldEquals("StakingPosition", id,
                "pool",
                address.toHexString()
            )
            assert.fieldEquals("StakingPosition", id,
                "owner",
                staker.toHexString()
            )
            assert.fieldEquals("StakingPosition", id,
                "stakedBalance",
                stakedBalance.toString()
            )
            assert.fieldEquals("StakingPosition", id,
                "totalRewardsClaimed",
                totalRewardsClaimed.plus(amount).toString()
            )
        })

        test("creates RewardsClaimed entity", () => {
            clearStore()
            const event = createRewardsClaimedEvent(address, staker, amount)
            handleRewardsClaimed(event)

            assert.entityCount("RewardsClaimed", 1)
            const id = event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()

            assert.entityCount("StakingPosition", 1)
            const stakingPositionId = address.concat(staker).toHexString()

            assert.fieldEquals("RewardsClaimed", id,
                "staker",
                staker.toHexString()
            )
            assert.fieldEquals("RewardsClaimed", id,
                "stakingPosition",
                stakingPositionId
            )
            assert.fieldEquals("RewardsClaimed", id,
                "rewardAmount",
                amount.toString()
            )
            assert.fieldEquals("RewardsClaimed", id,
                "blockNumber",
                event.block.number.toString()
            )
            assert.fieldEquals("RewardsClaimed", id,
                "blockTimestamp",
                event.block.timestamp.toString()
            )
            assert.fieldEquals("RewardsClaimed", id,
                "transactionHash",
                event.transaction.hash.toHexString()
            )
        })
    })

    describe("TokensStaked event", () => {
        beforeEach(() => {
            clearStore()
            const event = createTokensStakedEvent(address, staker, amount)
            handleTokensStaked(event)
        })

        test("creates StakingContract entity and updates staked balance", () => {
            assert.entityCount("Staking", 1)
            const id = address.toHexString()

            assert.fieldEquals("Staking", id,
                "rewardToken",
                rewardToken.toHexString()
            )
            assert.fieldEquals("Staking", id,
                "stakingToken",
                stakingToken.toHexString()
            )
            assert.fieldEquals("Staking", id,
                "rewardRatioNumerator",
                ratioNumerator.toString()
            )
            assert.fieldEquals("Staking", id,
                "rewardRatioDenominator",
                ratioDenominator.toString()
            )
            assert.fieldEquals("Staking", id,
                "timeUnit",
                timeUnit.toString()
            )
            assert.fieldEquals("Staking", id,
                "stakedBalance",
                stakedBalance.plus(amount).toString()
            )
            assert.fieldEquals("Staking", id,
                "rewardsBalance",
                rewardsBalance.toString()
            )
            assert.fieldEquals("Staking", id,
                "totalStaked",
                stakedBalance.plus(amount).toString()
            )
            assert.fieldEquals("Staking", id,
                "totalRewardsClaimed",
                totalRewardsClaimed.toString()
            )
        })

        test("creates StakingPosition entity and updates staked balance", () => {
            assert.entityCount("StakingPosition", 1)
            const id = address.concat(staker).toHexString()

            // Staker account should exist
            assert.entityCount("Account", 1)

            assert.fieldEquals("StakingPosition", id,
                "pool",
                address.toHexString()
            )
            assert.fieldEquals("StakingPosition", id,
                "owner",
                staker.toHexString()
            )
            assert.fieldEquals("StakingPosition", id,
                "stakedBalance",
                stakedBalance.plus(amount).toString()
            )
            assert.fieldEquals("StakingPosition", id,
                "totalRewardsClaimed",
                totalRewardsClaimed.toString()
            )
        })

        test("creates TokensStaked entity", () => {
            clearStore()
            const event = createTokensStakedEvent(address, staker, amount)
            handleTokensStaked(event)

            assert.entityCount("TokensStaked", 1)
            const id = event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()

            assert.entityCount("StakingPosition", 1)
            const stakingPositionId = address.concat(staker).toHexString()

            assert.fieldEquals("TokensStaked", id,
                "staker",
                staker.toHexString()
            )
            assert.fieldEquals("TokensStaked", id,
                "stakingPosition",
                stakingPositionId
            )
            assert.fieldEquals("TokensStaked", id,
                "amount",
                amount.toString()
            )
            assert.fieldEquals("TokensStaked", id,
                "blockNumber",
                event.block.number.toString()
            )
            assert.fieldEquals("TokensStaked", id,
                "blockTimestamp",
                event.block.timestamp.toString()
            )
            assert.fieldEquals("TokensStaked", id,
                "transactionHash",
                event.transaction.hash.toHexString()
            )
        })
    })

    describe("TokensWithdrawn event", () => {
        beforeEach(() => {
            clearStore()
            const event = createTokensWithdrawnEvent(address, staker, amount)
            handleTokensWithdrawn(event)
        })

        test("creates StakingContract entity and updates staked balance", () => {
            assert.entityCount("Staking", 1)
            const id = address.toHexString()

            assert.fieldEquals("Staking", id,
                "rewardToken",
                rewardToken.toHexString()
            )
            assert.fieldEquals("Staking", id,
                "stakingToken",
                stakingToken.toHexString()
            )
            assert.fieldEquals("Staking", id,
                "rewardRatioNumerator",
                ratioNumerator.toString()
            )
            assert.fieldEquals("Staking", id,
                "rewardRatioDenominator",
                ratioDenominator.toString()
            )
            assert.fieldEquals("Staking", id,
                "timeUnit",
                timeUnit.toString()
            )
            assert.fieldEquals("Staking", id,
                "stakedBalance",
                stakedBalance.minus(amount).toString()
            )
            assert.fieldEquals("Staking", id,
                "rewardsBalance",
                rewardsBalance.toString()
            )
            assert.fieldEquals("Staking", id,
                "totalStaked",
                stakedBalance.toString()
            )
            assert.fieldEquals("Staking", id,
                "totalRewardsClaimed",
                totalRewardsClaimed.toString()
            )
        })

        test("creates StakingPosition entity and updates staked balance", () => {
            assert.entityCount("StakingPosition", 1)
            const id = address.concat(staker).toHexString()

            // Staker account should exist
            assert.entityCount("Account", 1)

            assert.fieldEquals("StakingPosition", id,
                "pool",
                address.toHexString()
            )
            assert.fieldEquals("StakingPosition", id,
                "owner",
                staker.toHexString()
            )
            assert.fieldEquals("StakingPosition", id,
                "stakedBalance",
                stakedBalance.minus(amount).toString()
            )
            assert.fieldEquals("StakingPosition", id,
                "totalRewardsClaimed",
                totalRewardsClaimed.toString()
            )
        })

        test("creates TokensWithdrawn entity", () => {
            clearStore()
            const event = createTokensWithdrawnEvent(address, staker, amount)
            handleTokensWithdrawn(event)

            assert.entityCount("TokensWithdrawn", 1)
            const id = event.transaction.hash.concatI32(event.logIndex.toI32()).toHexString()

            assert.entityCount("StakingPosition", 1)
            const stakingPositionId = address.concat(staker).toHexString()

            assert.fieldEquals("TokensWithdrawn", id,
                "staker",
                staker.toHexString()
            )
            assert.fieldEquals("TokensWithdrawn", id,
                "stakingPosition",
                stakingPositionId
            )
            assert.fieldEquals("TokensWithdrawn", id,
                "amount",
                amount.toString()
            )
            assert.fieldEquals("TokensWithdrawn", id,
                "blockNumber",
                event.block.number.toString()
            )
            assert.fieldEquals("TokensWithdrawn", id,
                "blockTimestamp",
                event.block.timestamp.toString()
            )
            assert.fieldEquals("TokensWithdrawn", id,
                "transactionHash",
                event.transaction.hash.toHexString()
            )
        })
    })

    describe("UpdatedRewardRatio event", () => {
        beforeEach(() => {
            clearStore()
            const newNumerator = BigInt.fromI32(2)
            const newDenominator = BigInt.fromI32(100)
            const event = createUpdatedRewardRatioEvent(address, ratioNumerator, newNumerator, ratioDenominator, newDenominator)
            handleUpdatedRewardRatio(event)
        })

        test("creates StakingContract entity and updates reward ratio", () => {
            assert.entityCount("Staking", 1)
            const id = address.toHexString()

            assert.fieldEquals("Staking", id,
                "rewardToken",
                rewardToken.toHexString()
            )
            assert.fieldEquals("Staking", id,
                "stakingToken",
                stakingToken.toHexString()
            )
            assert.fieldEquals("Staking", id,
                "rewardRatioNumerator",
                BigInt.fromI32(2).toString()
            )
            assert.fieldEquals("Staking", id,
                "rewardRatioDenominator",
                BigInt.fromI32(100).toString()
            )
            assert.fieldEquals("Staking", id,
                "timeUnit",
                timeUnit.toString()
            )
            assert.fieldEquals("Staking", id,
                "stakedBalance",
                stakedBalance.toString()
            )
            assert.fieldEquals("Staking", id,
                "rewardsBalance",
                rewardsBalance.toString()
            )
            assert.fieldEquals("Staking", id,
                "totalStaked",
                stakedBalance.toString()
            )
            assert.fieldEquals("Staking", id,
                "totalRewardsClaimed",
                totalRewardsClaimed.toString()
            )
        })
    })

    describe("UpdatedTimeUnit event", () => {
        beforeEach(() => {
            clearStore()
            const newTimeUnit = timeUnit.times(BigInt.fromI32(2))
            const event = createUpdatedTimeUnitEvent(address, timeUnit, newTimeUnit)
            handleUpdatedTimeUnit(event)
        })

        test("creates StakingContract entity and updates time unit", () => {
            assert.entityCount("Staking", 1)
            const id = address.toHexString()

            assert.fieldEquals("Staking", id,
                "rewardToken",
                rewardToken.toHexString()
            )
            assert.fieldEquals("Staking", id,
                "stakingToken",
                stakingToken.toHexString()
            )
            assert.fieldEquals("Staking", id,
                "rewardRatioNumerator",
                ratioNumerator.toString()
            )
            assert.fieldEquals("Staking", id,
                "rewardRatioDenominator",
                ratioDenominator.toString()
            )
            assert.fieldEquals("Staking", id,
                "timeUnit",
                timeUnit.times(BigInt.fromI32(2)).toString()
            )
            assert.fieldEquals("Staking", id,
                "stakedBalance",
                stakedBalance.toString()
            )
            assert.fieldEquals("Staking", id,
                "rewardsBalance",
                rewardsBalance.toString()
            )
            assert.fieldEquals("Staking", id,
                "totalStaked",
                stakedBalance.toString()
            )
            assert.fieldEquals("Staking", id,
                "totalRewardsClaimed",
                totalRewardsClaimed.toString()
            )
        })
    })
})

function createRewardTokensDepositedByAdminEvent(
    token: Address,
    amount: BigInt
): RewardTokensDepositedByAdminEvent {
    const event = changetype<RewardTokensDepositedByAdminEvent>(newMockEvent())
  
    event.address = token
    event.parameters = new Array()
  
    event.parameters.push(
      new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
    )
  
    return event
}

function createRewardTokensWithdrawnByAdminEvent(
    token: Address,
    amount: BigInt
): RewardTokensWithdrawnByAdminEvent {
    const event = changetype<RewardTokensWithdrawnByAdminEvent>(newMockEvent())
  
    event.address = token
    event.parameters = new Array()
  
    event.parameters.push(
      new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
    )
  
    return event
}

function createRewardsClaimedEvent(
    token: Address,
    staker: Address,
    amount: BigInt
): RewardsClaimedEvent {
    const event = changetype<RewardsClaimedEvent>(newMockEvent())
  
    event.address = token
    event.parameters = new Array()
  
    event.parameters.push(
        new ethereum.EventParam("staker", ethereum.Value.fromAddress(staker))
    )
    event.parameters.push(
        new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
    )
  
    return event
}

function createTokensStakedEvent(
    token: Address,
    staker: Address,
    amount: BigInt
): TokensStakedEvent {
    const event = changetype<TokensStakedEvent>(newMockEvent())
  
    event.address = token
    event.parameters = new Array()
  
    event.parameters.push(
        new ethereum.EventParam("staker", ethereum.Value.fromAddress(staker))
    )
    event.parameters.push(
        new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
    )
  
    return event
}

function createTokensWithdrawnEvent(
    token: Address,
    staker: Address,
    amount: BigInt
): TokensWithdrawnEvent {
    const event = changetype<TokensWithdrawnEvent>(newMockEvent())
  
    event.address = token
    event.parameters = new Array()
  
    event.parameters.push(
        new ethereum.EventParam("staker", ethereum.Value.fromAddress(staker))
    )
    event.parameters.push(
        new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
    )
  
    return event
}

function createUpdatedRewardRatioEvent(
    token: Address,
    oldNumerator: BigInt,
    newNumerator: BigInt,
    oldDenominator: BigInt,
    newDenominator: BigInt
): UpdatedRewardRatioEvent {
    const event = changetype<UpdatedRewardRatioEvent>(newMockEvent())
  
    event.address = token
    event.parameters = new Array()
  
    event.parameters.push(
        new ethereum.EventParam("oldNumerator", ethereum.Value.fromUnsignedBigInt(oldNumerator))
    )
    event.parameters.push(
        new ethereum.EventParam("newNumerator", ethereum.Value.fromUnsignedBigInt(newNumerator))
    )
    event.parameters.push(
        new ethereum.EventParam("oldDenominator", ethereum.Value.fromUnsignedBigInt(oldDenominator))
    )
    event.parameters.push(
        new ethereum.EventParam("newDenominator", ethereum.Value.fromUnsignedBigInt(newDenominator))
    )
  
    return event
}

function createUpdatedTimeUnitEvent(
    token: Address,
    oldTimeUnit: BigInt,
    newTimeUnit: BigInt
): UpdatedTimeUnitEvent {
    const event = changetype<UpdatedTimeUnitEvent>(newMockEvent())
  
    event.address = token
    event.parameters = new Array()
  
    event.parameters.push(
        new ethereum.EventParam("oldTimeUnit", ethereum.Value.fromUnsignedBigInt(oldTimeUnit))
    )
    event.parameters.push(
        new ethereum.EventParam("newTimeUnit", ethereum.Value.fromUnsignedBigInt(newTimeUnit))
    )
  
    return event
}
