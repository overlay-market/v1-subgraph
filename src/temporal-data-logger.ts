import { BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts"
import { Account, ActiveAccount, Market, MarketHourData, MarketState, UsageMetricsDailySnapshot } from "../generated/schema"
import { SECONDS_PER_DAY, ZERO_BI } from "./utils/constants";

export function takeSnapshots(
  event: ethereum.Event,
  market: Market,
  account: Account,
  volumeAmount?: BigInt, 
  mintAmount?: BigInt
): void {
  if (volumeAmount) {
    updateMarketHourData(market, event.block.timestamp, volumeAmount, mintAmount);
  }
  updateUsageMetricsDailySnapshot(event, account);
}

export function updateUsageMetricsDailySnapshot(event: ethereum.Event, account: Account): void {
  const days = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const id = Bytes.fromI32(days);
  const usageMetrics = new UsageMetricsDailySnapshot(id);

  // TODO: finish implementation
  if (usageMetrics === null) {
    usageMetrics.day = days;
    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.cumulativeTransactionCount = 0;
    usageMetrics.totalPoolCount = 0;
  }

  const dailyActiveAccountId = Bytes.fromUTF8(
    `daily-${account.id.toHex()}-${days}`
  );
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetrics.dailyActiveUsers += 1;
  }

  usageMetrics.timestamp = event.block.timestamp;
  usageMetrics.blockNumber = event.block.number;

  usageMetrics.save();
}

export function updateMarketHourData(market: Market, eventTimestamp: BigInt, volumeAmount: BigInt, mintAmount?: BigInt): void {
  let timestamp = eventTimestamp.toI32()
  let hourIndex = timestamp / 3600 // get unique hour within unix history
  let hourStartUnix = hourIndex * 3600 // want the rounded effect
  let marketHourID = market.id.concatI32(hourIndex)
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

  marketHourData.oiLong = market.oiLong
  marketHourData.oiShort = market.oiShort
  marketHourData.fundingRate = calculateFundingRate(market)

  marketHourData.volume = marketHourData.volume.plus(volumeAmount)
  marketHourData.accumulatedTotalMint = market.totalMint
  marketHourData.save()
}

function calculateFundingRate(market: Market): BigInt {
  const oiLong = market.oiLong;
  const oiShort = market.oiShort;

  const isLongOverweight = oiLong.gt(oiShort);
  const oiOverweight = isLongOverweight ? oiLong : oiShort;
  const oiUnderweight = isLongOverweight ? oiShort : oiLong;

  // Calculate total open interest and imbalance
  const oiTotal = oiOverweight.plus(oiUnderweight);
  const oiImbalance = oiOverweight.minus(oiUnderweight);

  // If total open interest or imbalance is zero, return a funding rate of 0
  if (oiTotal.isZero() || oiImbalance.isZero()) {
    return BigInt.fromI32(0);
  }

  const k = market.k;

  // Calculate funding rate using the formula: (oiImbalance / oiTotal) * (2 * k)
  const twoK = k.times(BigInt.fromI32(2));

  // To mimic Solidity's division and precision behavior, we need to scale the result.
  // Multiply before dividing to retain precision.
  const rate = oiImbalance.times(twoK).div(oiTotal);

  // Return the funding rate, positive if long side is overweight, negative otherwise
  return isLongOverweight ? rate : rate.neg();
}