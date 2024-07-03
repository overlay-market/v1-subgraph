import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { Market, Transaction, Position, Factory, Account, MarketState, Analytics, AnalyticsHourData } from '../../generated/schema'
import { OverlayV1Market } from '../../generated/templates/OverlayV1Market/OverlayV1Market'
import { OverlayV1Market as MarketTemplate } from '../../generated/templates';
import { integer } from '@protofire/subgraph-toolkit'
import { ZERO_BI, ZERO_BD, stateContract, factoryContract } from './constants'
import { loadAnalyticsHourData } from '.';

export function updateMarketState(marketAddress: string): MarketState {
    let marketState = MarketState.load(marketAddress)
  
    if (marketState === null) {
      marketState = new MarketState(marketAddress)
    }

    let _marketStateStatus = stateContract.try_marketState(Address.fromString(marketAddress))

    if (_marketStateStatus.reverted) {
        marketState.market = marketAddress
        marketState.bid = ZERO_BI
        marketState.ask = ZERO_BI
        marketState.mid = ZERO_BI
        marketState.volumeBid = ZERO_BI
        marketState.volumeAsk = ZERO_BI
        marketState.oiLong = ZERO_BI
        marketState.oiShort = ZERO_BI
        marketState.capOi = ZERO_BI
        marketState.circuitBreakerLevel = ZERO_BI
        marketState.fundingRate = ZERO_BI
    } else {
        let _marketState = _marketStateStatus.value
        marketState.market = marketAddress
        marketState.bid = _marketState.bid
        marketState.ask = _marketState.ask
        marketState.mid = _marketState.mid
        marketState.volumeBid = _marketState.volumeBid
        marketState.volumeAsk = _marketState.volumeAsk
        marketState.oiLong = _marketState.oiLong
        marketState.oiShort = _marketState.oiShort
        marketState.capOi = _marketState.capOi
        marketState.circuitBreakerLevel = _marketState.circuitBreakerLevel
        marketState.fundingRate = _marketState.fundingRate
    }

    marketState.save()

    return marketState
}

export function updateAnalyticsHourData(analytics: Analytics, eventTimestamp: BigInt): AnalyticsHourData {

    let analyticsHourData = loadAnalyticsHourData(analytics.id, eventTimestamp)

    analyticsHourData.totalUsers = analytics.totalUsers
    analyticsHourData.totalTransactions = analytics.totalTransactions
    analyticsHourData.totalTokensLocked = analytics.totalTokensLocked
    analyticsHourData.totalVolumeBuilds = analytics.totalVolumeBuilds
    analyticsHourData.totalVolumeUnwinds = analytics.totalVolumeUnwinds
    analyticsHourData.totalVolumeLiquidations = analytics.totalVolumeLiquidations
    analyticsHourData.totalVolume = analytics.totalVolume

    analyticsHourData.save()

    return analyticsHourData
}