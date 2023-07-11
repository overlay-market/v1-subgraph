import { Address, BigInt } from '@graphprotocol/graph-ts'

import {
    RewardTokensDepositedByAdmin as RewardTokensDepositedByAdminEvent,
    RewardTokensWithdrawnByAdmin as RewardTokensWithdrawnByAdminEvent,
    RewardsClaimed as RewardsClaimedEvent,
    TokensStaked as TokensStakedEvent,
    TokensWithdrawn as TokensWithdrawnEvent,
    UpdatedRewardRatio as UpdatedRewardRatioEvent,
    UpdatedTimeUnit as UpdatedTimeUnitEvent,
    TokenStake as StakingContract
} from '../generated/TokenStake/TokenStake'
import {
    RewardsClaimed,
    TokensStaked,
    TokensWithdrawn,
    Staking,
    StakingPosition,
} from "../generated/schema"
import { loadAccount } from './utils'

export function handleRewardTokensDepositedByAdmin(event: RewardTokensDepositedByAdminEvent): void {
    const staking = loadStakingContract(event.address)
    staking.rewardsBalance = staking.rewardsBalance.plus(event.params._amount)
    staking.save()
}

export function handleRewardTokensWithdrawnByAdmin(event: RewardTokensWithdrawnByAdminEvent): void {
    const staking = loadStakingContract(event.address)
    staking.rewardsBalance = staking.rewardsBalance.minus(event.params._amount)
    staking.save()
}

export function handleRewardsClaimed(event: RewardsClaimedEvent): void {
    const staking = loadStakingContract(event.address)
    const stakingPosition = loadStakingPosition(event.address, event.params.staker)
    const amount = event.params.rewardAmount

    staking.rewardsBalance = staking.rewardsBalance.minus(amount)
    staking.totalRewardsClaimed = staking.totalRewardsClaimed.plus(amount)

    stakingPosition.totalRewardsClaimed = stakingPosition.totalRewardsClaimed.plus(amount)

    const entity = new RewardsClaimed(
        event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    entity.staker = event.params.staker
    entity.stakingPosition = stakingPosition.id
    entity.rewardAmount = event.params.rewardAmount
    entity.blockNumber = event.block.number
    entity.blockTimestamp = event.block.timestamp
    entity.transactionHash = event.transaction.hash

    staking.save()
    stakingPosition.save()
    entity.save()
}

export function handleTokensStaked(event: TokensStakedEvent): void {
    const staking = loadStakingContract(event.address)
    const stakingPosition = loadStakingPosition(event.address, event.params.staker)
    const amount = event.params.amount

    staking.stakedBalance = staking.stakedBalance.plus(amount)
    staking.totalStaked = staking.totalStaked.plus(amount)

    stakingPosition.stakedBalance = stakingPosition.stakedBalance.plus(amount)

    const entity = new TokensStaked(
        event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    entity.staker = event.params.staker
    entity.stakingPosition = stakingPosition.id
    entity.amount = event.params.amount
    entity.blockNumber = event.block.number
    entity.blockTimestamp = event.block.timestamp
    entity.transactionHash = event.transaction.hash

    staking.save()
    stakingPosition.save()
    entity.save()
}

export function handleTokensWithdrawn(event: TokensWithdrawnEvent): void {
    const staking = loadStakingContract(event.address)
    const stakingPosition = loadStakingPosition(event.address, event.params.staker)
    const amount = event.params.amount

    staking.stakedBalance = staking.stakedBalance.minus(amount)
    stakingPosition.stakedBalance = stakingPosition.stakedBalance.minus(amount)

    const entity = new TokensWithdrawn(
        event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    entity.staker = event.params.staker
    entity.amount = event.params.amount
    entity.blockNumber = event.block.number
    entity.blockTimestamp = event.block.timestamp
    entity.transactionHash = event.transaction.hash

    staking.save()
    stakingPosition.save()
    entity.save()
}

export function handleUpdatedRewardRatio(event: UpdatedRewardRatioEvent): void {
    const staking = loadStakingContract(event.address)
    staking.rewardRatioNumerator = event.params.newNumerator
    staking.rewardRatioDenominator = event.params.newDenominator
    staking.save()
}

export function handleUpdatedTimeUnit(event: UpdatedTimeUnitEvent): void {
    const staking = loadStakingContract(event.address)
    staking.timeUnit = event.params.newTimeUnit
    staking.save()
}

// Helpers

function loadStakingContract(address: Address): Staking {
    let staking = Staking.load(address)
    if (staking == null) {
        const tokenStakeContract = StakingContract.bind(address)
        staking = new Staking(address)
        staking.rewardToken = tokenStakeContract.rewardToken()
        staking.stakingToken = tokenStakeContract.stakingToken()
        const rewardRatio = tokenStakeContract.getRewardRatio()
        staking.rewardRatioNumerator = rewardRatio.get_numerator()
        staking.rewardRatioDenominator = rewardRatio.get_denominator()
        staking.timeUnit = tokenStakeContract.getTimeUnit()
        staking.stakedBalance = tokenStakeContract.stakingTokenBalance()
        staking.rewardsBalance = tokenStakeContract.getRewardTokenBalance()
        staking.totalStaked = tokenStakeContract.stakingTokenBalance()
        staking.totalRewardsClaimed = BigInt.fromI32(0)
    }
    return staking
}
  
function loadStakingPosition(pool: Address, owner: Address): StakingPosition {
    let stakingPosition = StakingPosition.load(pool.concat(owner))
    if (stakingPosition == null) {
        stakingPosition = new StakingPosition(pool.concat(owner))
        stakingPosition.pool = pool
        stakingPosition.owner = loadAccount(owner).id
        stakingPosition.stakedBalance = BigInt.fromI32(0)
        stakingPosition.totalRewardsClaimed = BigInt.fromI32(0)
    }
    return stakingPosition
}
