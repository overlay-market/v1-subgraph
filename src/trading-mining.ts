import { Address, BigInt } from "@graphprotocol/graph-ts"

import {
    TradingMining as TradingMiningContract,
    RewardTokensUpdated as RewardTokensUpdatedEvent,    
} from "../generated/TradingMining/TradingMining"
import { TradingMining, TradingMiningEpochVolume } from "../generated/schema"
import { ZERO_BI, TRADING_MINING_ADDRESS } from "./utils/constants"
import { loadAccount } from "./utils"

export function handleRewardTokensUpdated(event: RewardTokensUpdatedEvent): void {
    const tradingMining = loadTradingMining(event.address)
    tradingMining.rewardToken2 = event.params.rewardToken2
    tradingMining.token1Percentage = event.params.token1Percentage
    tradingMining.save()
}

export function updateTraderEpochVolume(trader: Address, volume: BigInt): void {
    const account = loadAccount(trader)
    
    const tradingMining = TradingMiningContract.bind(Address.fromString(TRADING_MINING_ADDRESS))
    const epoch = tradingMining.getCurrentEpoch()
    const tradingMiningEpochVolume = loadTradingMiningEpochVolume(trader, epoch)
    
    // PCD holders get a bonus on their trading mining rewards
    if (account.planckCatBalance.gt(ZERO_BI)) {
        const tm = loadTradingMining(Address.fromString(TRADING_MINING_ADDRESS))
        const bonus = BigInt.fromI32(tm.pcdHolderBonusPercentage)
        volume = volume.plus(volume.times(bonus).div(BigInt.fromI32(100)))
    }

    tradingMiningEpochVolume.volume = tradingMiningEpochVolume.volume.plus(volume)

    tradingMiningEpochVolume.save()
}

function loadTradingMining(address: Address): TradingMining {
    let tradingMining = TradingMining.load(address)
    if (tradingMining == null) {
        const contract = TradingMiningContract.bind(address)
        tradingMining = new TradingMining(address)
        tradingMining.rewardToken1 = contract.rewardToken1()
        tradingMining.rewardToken2 = contract.rewardToken2()
        tradingMining.token1Percentage = contract.token1Percentage()
        tradingMining.startTime = contract.startTime()
        tradingMining.epochDuration = contract.epochDuration()
        tradingMining.pcdHolderBonusPercentage = contract.pcdHolderBonusPercentage()
        tradingMining.maxRewardPerEpochPerAddress = contract.maxRewardPerEpochPerAddress()
        tradingMining.totalAirdropped = ZERO_BI
        tradingMining.save()
    }
    return tradingMining
}

function loadTradingMiningEpochVolume(trader: Address, epoch: BigInt): TradingMiningEpochVolume {
    const account = loadAccount(trader)
    account.save() // ensure account exists

    const id = trader.concatI32(epoch.toI32())
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
