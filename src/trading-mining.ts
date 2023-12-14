import { Address, BigInt } from "@graphprotocol/graph-ts"

import {
    TradingMining as TradingMiningContract,
    RewardTokensUpdated as RewardTokensUpdatedEvent,
    TotalRewardsUpdated as TotalRewardsUpdatedEvent,
    PcdHolderBonusPercentageUpdated as PcdHolderBonusPercentageUpdatedEvent
} from "../generated/TradingMining/TradingMining"
import { TradingMining, TradingMiningEpoch, TradingMiningEpochVolume } from "../generated/schema"
import { ZERO_BI, TRADING_MINING_ADDRESS } from "./utils/constants"
import { loadAccount } from "./utils"

export function handleRewardTokensUpdated(event: RewardTokensUpdatedEvent): void {
    const tradingMining = loadTradingMining(event.address)
    tradingMining.rewardToken2 = event.params.rewardToken2
    tradingMining.token1Percentage = event.params.token1Percentage
    tradingMining.save()
}

export function handleTotalRewardsUpdated(event: TotalRewardsUpdatedEvent): void {
    const tradingMining = loadTradingMining(event.address)
    tradingMining.totalRewards = event.params.totalRewards
    tradingMining.save()
}

export function handlePcdHolderBonusPercentageUpdated(event: PcdHolderBonusPercentageUpdatedEvent): void {
    const tradingMining = loadTradingMining(event.address)
    tradingMining.pcdHolderBonusPercentage = event.params.pcdHolderBonusPercentage
    tradingMining.save()
}

export function updateTraderEpochVolume(trader: Address, volume: BigInt): void {
    const account = loadAccount(trader)
    const tmAddress = Address.fromString(TRADING_MINING_ADDRESS)

    // Note: we need the trading mining contract to be deployed to get the current epoch, etc.
    if (TradingMining.load(tmAddress) == null) return
    
    const tradingMining = TradingMiningContract.bind(tmAddress)
    
    // Return if start time has not been reached yet
    if (tradingMining.try_getCurrentEpoch().reverted) return

    const epoch = tradingMining.getCurrentEpoch()

    const tradingMiningEpochVolume = loadTradingMiningEpochVolume(trader, tmAddress, epoch)
    const tradingMiningEpoch = loadTradingMiningEpoch(tmAddress, epoch)
    
    // PCD holders get a bonus on their trading mining rewards
    if (account.planckCatBalance.gt(ZERO_BI)) {
        const tm = loadTradingMining(tmAddress)
        const bonus = BigInt.fromI32(tm.pcdHolderBonusPercentage)
        volume = volume.plus(volume.times(bonus).div(BigInt.fromI32(100)))
    }

    tradingMiningEpochVolume.volume = tradingMiningEpochVolume.volume.plus(volume)
    tradingMiningEpoch.totalVolume = tradingMiningEpoch.totalVolume.plus(volume)

    tradingMiningEpochVolume.save()
    tradingMiningEpoch.save()
}

function loadTradingMining(address: Address): TradingMining {
    let tradingMining = TradingMining.load(address)
    if (tradingMining == null) {
        const contract = TradingMiningContract.bind(address)
        tradingMining = new TradingMining(address)
        tradingMining.totalRewards = contract.totalRewards()
        tradingMining.rewardToken1 = contract.rewardToken1()
        tradingMining.rewardToken2 = contract.rewardToken2()
        tradingMining.token1Percentage = contract.token1Percentage()
        tradingMining.startTime = contract.startTime()
        tradingMining.epochDuration = contract.epochDuration()
        tradingMining.pcdHolderBonusPercentage = contract.pcdHolderBonusPercentage()
        tradingMining.maxRewardPerEpochPerAddress = contract.maxRewardPerEpochPerAddress()
        tradingMining.save()
    }
    return tradingMining
}

function loadTradingMiningEpoch(tradingMining: Address, epoch: BigInt): TradingMiningEpoch {
    const id = tradingMining.concatI32(epoch.toI32())
    let tradingMiningEpoch = TradingMiningEpoch.load(id)

    if (tradingMiningEpoch == null) {
        const tm = loadTradingMining(tradingMining)
        tradingMiningEpoch = new TradingMiningEpoch(id)
        tradingMiningEpoch.epoch = epoch
        tradingMiningEpoch.totalVolume = ZERO_BI
        tradingMiningEpoch.totalRewards = tm.totalRewards
        tradingMiningEpoch.token1Percentage = tm.token1Percentage
        tradingMiningEpoch.save()
    }

    return tradingMiningEpoch
}

function loadTradingMiningEpochVolume(
    trader: Address,
    tradingMining: Address,
    epoch: BigInt
): TradingMiningEpochVolume {
    const account = loadAccount(trader)
    account.save() // ensure account exists

    const id = tradingMining.concat(trader).concatI32(epoch.toI32())
    let tradingMiningEpochVolume = TradingMiningEpochVolume.load(id)
    if (tradingMiningEpochVolume == null) {
        tradingMiningEpochVolume = new TradingMiningEpochVolume(id)
        tradingMiningEpochVolume.epoch = epoch
        tradingMiningEpochVolume.volume = ZERO_BI
        tradingMiningEpochVolume.trader = account.id
        tradingMiningEpochVolume.save()
    }
    return tradingMiningEpochVolume
}
