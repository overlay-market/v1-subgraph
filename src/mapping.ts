import { Address } from "@graphprotocol/graph-ts"
import { integer } from "@protofire/subgraph-toolkit";
import {
  MarketDeployed
} from "../generated/OverlayV1Factory/OverlayV1Factory"
import {
  OverlayV1Market,
  Build as BuildEvent,
  Liquidate as LiquidateEvent,
  Unwind as UnwindEvent
} from "../generated/templates/OverlayV1Market/OverlayV1Market";

import { Market } from "../generated/schema"
import { OverlayV1Market as MarketTemplate } from './../generated/templates';
import { FACTORY_ADDRESS, ZERO_BI, ONE_BI } from './utils/constants';
import { loadMarket, loadFactory, loadAccount } from "./utils";
import { takeSnapshots } from "./temporal-data-logger";
import { updateMarketState } from "./utils/helpers";

// TODO: rename or separate this file into multiple files

export function handleMarketDeployed(event: MarketDeployed): void {

  // load factory
  let factory = loadFactory(Address.fromString(FACTORY_ADDRESS))

  // adding a new market to the count
  factory.marketCount = factory.marketCount.plus(ONE_BI)

  // vars that will be used to populate the information for a new market
  let marketAddress = event.params.market
  let feedAddress = event.params.feed
  let marketContract = OverlayV1Market.bind(event.params.market)
  let market = new Market(marketAddress) as Market
  let marketState = updateMarketState(market.id)

  // basic info about the market
  market.feedAddress = feedAddress.toHexString()
  market.factory = factory.id
  market.createdAtTimestamp = event.block.timestamp
  market.createdAtBlockNumber = event.block.number

  // all params
  market.k = marketContract.params(integer.fromNumber(0))
  market.lmbda = marketContract.params(integer.fromNumber(1))
  market.delta = marketContract.params(integer.fromNumber(2))
  market.capPayoff = marketContract.params(integer.fromNumber(3))
  market.capNotional = marketContract.params(integer.fromNumber(4))
  market.capLeverage = marketContract.params(integer.fromNumber(5))
  market.circuitBreakerWindow = marketContract.params(integer.fromNumber(6))
  market.circuitBreakerMintTarget = marketContract.params(integer.fromNumber(7))
  market.maintenanceMarginFraction = marketContract.params(integer.fromNumber(8))
  market.maintenanceMarginBurnRate = marketContract.params(integer.fromNumber(9))
  market.liquidationFeeRate = marketContract.params(integer.fromNumber(10))
  market.tradingFeeRate = marketContract.params(integer.fromNumber(11))
  market.minCollateral = marketContract.params(integer.fromNumber(12))
  market.priceDriftUpperLimit = marketContract.params(integer.fromNumber(13))
  market.averageBlockTime = marketContract.params(integer.fromNumber(14))
  market.oiLong = marketState.oiLong
  market.oiShort = marketState.oiShort
  market.oiLongShares = ZERO_BI;
  market.oiShortShares = ZERO_BI;
  market.isShutdown = false
  market.totalBuildFees = ZERO_BI
  market.numberOfBuilds = ZERO_BI
  market.totalUnwindFees = ZERO_BI
  market.numberOfUnwinds = ZERO_BI
  market.totalLiquidateFees = ZERO_BI
  market.numberOfLiquidates = ZERO_BI
  market.totalFees = ZERO_BI
  market.totalVolume = ZERO_BI
  market.totalMint = ZERO_BI
  market.dpUpperLimit = marketContract.dpUpperLimit()

  market.save()
  // create tracked market contract based on template
  MarketTemplate.create(event.params.market)
  factory.save()
}

export function handleBuild(event: BuildEvent): void {
  // Load the market entity using the market address from the event
  let market = loadMarket(event, event.address)
  // Load the account entity corresponding to the sender of the transaction
  let sender = loadAccount(event.params.sender)

  // Update hourly market data with the new position's notional
  takeSnapshots(event, market, sender, ZERO_BI, ZERO_BI)
}

export function handleUnwind(event: UnwindEvent): void {
  // Load the market entity using the market address from the event
  let market = loadMarket(event, event.address)
  // Load the account entity corresponding to the sender of the transaction
  let sender = loadAccount(event.params.sender)
  // Update hourly market data with the new position's notional
  takeSnapshots(event, market, sender)
}

export function handleLiquidate(event: LiquidateEvent): void {
  // Load the market entity using the market address from the event
  let market = loadMarket(event, event.address)
  // Load the account entity corresponding to the sender (liquidator) of the transaction
  let sender = loadAccount(event.params.sender)

  // Update hourly market data with the new liquidation's volume and mint amount
  takeSnapshots(event, market, sender)
}
