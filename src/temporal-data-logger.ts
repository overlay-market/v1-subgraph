import { BigInt } from "@graphprotocol/graph-ts"
import { Market, MarketHourData, MarketState } from "../generated/schema"
import { ZERO_BI } from "./utils/constants";

export function updateMarketHourData(market: Market, eventTimestamp: BigInt, volumeAmount: BigInt, mintAmount?: BigInt): void {
    let timestamp = eventTimestamp.toI32()
    let hourIndex = timestamp / 3600 // get unique hour within unix history
    let hourStartUnix = hourIndex * 3600 // want the rounded effect
    let marketHourID = market.id
      .concat('-')
      .concat(hourIndex.toString())
    let marketHourData = MarketHourData.load(marketHourID)

    if (marketHourData === null) {
      marketHourData = new MarketHourData(marketHourID)
      marketHourData.periodStartUnix = hourStartUnix
      marketHourData.market = market.id
      marketHourData.minted = ZERO_BI
      marketHourData.burnt = ZERO_BI
      marketHourData.totalMint = ZERO_BI
      marketHourData.accumulatedTotalMint = ZERO_BI
      marketHourData.volume = ZERO_BI
      marketHourData.oiLong = ZERO_BI
      marketHourData.oiShort = ZERO_BI
      marketHourData.fundingRate = ZERO_BI
    }

    if (mintAmount) {
        if (mintAmount.ge(ZERO_BI)) {
        marketHourData.minted = marketHourData.minted.plus(mintAmount)
        } else {
        marketHourData.burnt = marketHourData.burnt.minus(mintAmount)
        }
        marketHourData.totalMint = marketHourData.totalMint.plus(mintAmount)
    }

    let marketState = MarketState.load(market.id)
    if (marketState) {
      marketHourData.oiLong = marketState.oiLong
      marketHourData.oiShort = marketState.oiShort
      marketHourData.fundingRate = marketState.fundingRate
    }

    marketHourData.volume = marketHourData.volume.plus(volumeAmount)
    marketHourData.accumulatedTotalMint = market.totalMint
    marketHourData.save()
}