import { Market, MintBurnMarketHourData } from "../generated/schema"
import {
  Liquidate as LiquidateEvent,
  Unwind as UnwindEvent,
} from "../generated/templates/OverlayV1Market/OverlayV1Market";
import { ZERO_BI } from "./utils/constants";

export function updateMintBurnMarketHourData(market: Market, event: UnwindEvent | LiquidateEvent): void {
    let timestamp = event.block.timestamp.toI32()
    let hourIndex = timestamp / 3600 // get unique hour within unix history
    let hourStartUnix = hourIndex * 3600 // want the rounded effect
    let marketHourID = market.id
      .concat('-')
      .concat(hourIndex.toString())
    let mintBurnMarketHourData = MintBurnMarketHourData.load(marketHourID)
    let mintBurnMarket = event.params.mint

    if (mintBurnMarketHourData === null) {
      mintBurnMarketHourData = new MintBurnMarketHourData(marketHourID)
      mintBurnMarketHourData.periodStartUnix = hourStartUnix
      mintBurnMarketHourData.market = market.id
      mintBurnMarketHourData.minted = ZERO_BI
      mintBurnMarketHourData.burnt = ZERO_BI
      mintBurnMarketHourData.total = ZERO_BI
    }

    if (mintBurnMarket.ge(ZERO_BI)) {
      mintBurnMarketHourData.minted = mintBurnMarketHourData.minted.plus(mintBurnMarket)
    } else {
      mintBurnMarketHourData.burnt = mintBurnMarketHourData.burnt.minus(mintBurnMarket)
    }

    mintBurnMarketHourData.total = mintBurnMarketHourData.total.plus(mintBurnMarket)
    mintBurnMarketHourData.save()
}