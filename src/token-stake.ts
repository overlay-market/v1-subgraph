import { Address, BigInt } from '@graphprotocol/graph-ts'

import {
    RewardTokensDepositedByAdmin as RewardTokensDepositedByAdminEvent,
    RewardTokensWithdrawnByAdmin as RewardTokensWithdrawnByAdminEvent,
    RewardsClaimed as RewardsClaimedEvent,
    TokensStaked as TokensStakedEvent,
    TokensWithdrawn as TokensWithdrawnEvent,
    UpdatedRewardRatio as UpdatedRewardRatioEvent,
    UpdatedTimeUnit as UpdatedTimeUnitEvent,
    TokenStake as TokenStakeContract
} from '../generated/TokenStake/TokenStake'
import {
    TokenStake,
    StakingPosition,
} from "../generated/schema"
import { loadAccount } from './utils'

export function handleRewardTokensDepositedByAdmin(event: RewardTokensDepositedByAdminEvent): void {
    const tokenStake = loadTokenStake(event.address)
    tokenStake.rewardsBalance = tokenStake.rewardsBalance.plus(event.params._amount)
    tokenStake.save()
}

export function handleRewardTokensWithdrawnByAdmin(event: RewardTokensWithdrawnByAdminEvent): void {
    const tokenStake = loadTokenStake(event.address)
    tokenStake.rewardsBalance = tokenStake.rewardsBalance.minus(event.params._amount)
    tokenStake.save()
}

export function handleRewardsClaimed(event: RewardsClaimedEvent): void {
    const tokenStake = loadTokenStake(event.address)
    const stakingPosition = loadStakingPosition(event.address, event.params.staker)
    const amount = event.params.rewardAmount

    tokenStake.rewardsBalance = tokenStake.rewardsBalance.minus(amount)
    tokenStake.totalRewardsClaimed = tokenStake.totalRewardsClaimed.plus(amount)

    stakingPosition.rewardsEarned = stakingPosition.rewardsEarned.plus(amount)

    tokenStake.save()
    stakingPosition.save()
}

export function handleTokensStaked(event: TokensStakedEvent): void {
    const tokenStake = loadTokenStake(event.address)
    const stakingPosition = loadStakingPosition(event.address, event.params.staker)
    const amount = event.params.amount

    tokenStake.stakedBalance = tokenStake.stakedBalance.plus(amount)
    tokenStake.totalStaked = tokenStake.totalStaked.plus(amount)

    stakingPosition.stakedBalance = stakingPosition.stakedBalance.plus(amount)

    tokenStake.save()
    stakingPosition.save()
}

export function handleTokensWithdrawn(event: TokensWithdrawnEvent): void {
    const tokenStake = loadTokenStake(event.address)
    const stakingPosition = loadStakingPosition(event.address, event.params.staker)
    const amount = event.params.amount

    tokenStake.stakedBalance = tokenStake.stakedBalance.minus(amount)
    stakingPosition.stakedBalance = stakingPosition.stakedBalance.minus(amount)

    tokenStake.save()
    stakingPosition.save()
}

export function handleUpdatedRewardRatio(event: UpdatedRewardRatioEvent): void {
    const tokenStake = loadTokenStake(event.address)
    tokenStake.rewardRatioNumerator = event.params.newNumerator
    tokenStake.rewardRatioDenominator = event.params.newDenominator
    tokenStake.save()
}

export function handleUpdatedTimeUnit(event: UpdatedTimeUnitEvent): void {
    const tokenStake = loadTokenStake(event.address)
    tokenStake.timeUnit = event.params.newTimeUnit
    tokenStake.save()
}

// Helpers

function loadTokenStake(address: Address): TokenStake {
    let tokenStake = TokenStake.load(address)
    if (tokenStake == null) {
        const tokenStakeContract = TokenStakeContract.bind(address)
        tokenStake = new TokenStake(address)
        tokenStake.rewardToken = tokenStakeContract.rewardToken()
        tokenStake.stakingToken = tokenStakeContract.stakingToken()
        const rewardRatio = tokenStakeContract.getRewardRatio()
        tokenStake.rewardRatioNumerator = rewardRatio.get_numerator()
        tokenStake.rewardRatioDenominator = rewardRatio.get_denominator()
        tokenStake.timeUnit = tokenStakeContract.getTimeUnit()
        tokenStake.stakedBalance = tokenStakeContract.stakingTokenBalance()
        tokenStake.rewardsBalance = tokenStakeContract.getRewardTokenBalance()
        tokenStake.totalStaked = tokenStakeContract.stakingTokenBalance()
        tokenStake.totalRewardsClaimed = BigInt.fromI32(0)
    }
    return tokenStake
}
  
function loadStakingPosition(pool: Address, owner: Address): StakingPosition {
    let stakingPosition = StakingPosition.load(pool.concat(owner))
    if (stakingPosition == null) {
        stakingPosition = new StakingPosition(pool.concat(owner))
        stakingPosition.pool = pool
        stakingPosition.owner = loadAccount(owner).id
        stakingPosition.stakedBalance = BigInt.fromI32(0)
        stakingPosition.rewardsEarned = BigInt.fromI32(0)
    }
    return stakingPosition
}
