import { Address, BigInt } from "@graphprotocol/graph-ts"
import { integer } from "@protofire/subgraph-toolkit";
import {
  OverlayV1Factory,
  FeeRecipientUpdated,
  FeedFactoryAdded,
  MarketDeployed,
  ParamUpdated
} from "../generated/OverlayV1Factory/OverlayV1Factory"
import {
  OverlayV1Market,
  Build as BuildEvent,
  Liquidate as LiquidateEvent,
  Unwind as UnwindEvent
} from "../generated/templates/OverlayV1Market/OverlayV1Market";
import { Factory, Market, Position, Build } from "../generated/schema"
import { OverlayV1Market as MarketTemplate } from './../generated/templates';
import { FACTORY_ADDRESS, ZERO_BI, ONE_BI, ZERO_BD, ADDRESS_ZERO, positionStateContract, factoryContract, oiStateContract } from "./utils/constants"
import { loadMarket, loadPosition, loadFactory, loadTransaction } from "./utils";

export function handleMarketDeployed(event: MarketDeployed): void {
  
  // load factory
  let factory = Factory.load(FACTORY_ADDRESS)
  if (factory === null) {
    factory = new Factory(FACTORY_ADDRESS)
    factory.marketCount = ZERO_BI
    factory.txCount = ZERO_BI
    factory.totalVolumeOVL = ZERO_BD
    factory.totalFeesOVL = ZERO_BD
    factory.totalValueLockedOVL = ZERO_BD
    // @TO-DO: require event to pass in feeRecipient address
    factory.feeRecipient = factoryContract.feeRecipient().toHexString()
    // @TO-DO: check if owner field is needed
    factory.owner = factoryContract.deployer().toHexString()
  }

  factory.marketCount = factory.marketCount.plus(ONE_BI)

  let marketAddress = event.params.market.toHexString()
  let marketContract = OverlayV1Market.bind(event.params.market)
  let market = new Market(marketAddress) as Market

  market.feedAddress = event.params.feed.toHexString()
  market.factory = factory.id
  market.createdAtTimestamp = event.block.timestamp
  market.createdAtBlockNumber = event.block.number
  // @TO-DO: pass in token symbol string OR contract address
  // market.baseToken = ADDRESS_ZERO
  // market.quoteToken = ADDRESS_ZERO
  // @TO-DO: pass back market params
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
  market.oiLong = ZERO_BI
  market.oiShort = ZERO_BI

  market.save()
  // create tracked market contract based on template
  MarketTemplate.create(event.params.market)
  factory.save()
}

export function handleBuild(event: BuildEvent): void {
  let market = loadMarket(event)
  let sender = event.params.sender
  let positionId = event.params.positionId
  let id = market.id.concat('-').concat(positionId.toHexString())
  let position = new Position(id) as Position
  
  position.owner = sender.toHexString()
  position.positionId = positionId
  // @TO-DO: check if below passes in market contract address
  position.market = market.id
  position.initialOi = event.params.oi
  position.initialDebt = event.params.debt
  position.isLong = event.params.isLong
  position.entryPrice = event.params.price
  position.isLiquidated = false
  position.currentOi = event.params.oi
  position.currentDebt = event.params.debt
  // @TO-DO: pass in leverage position built with
  position.leverage = ZERO_BI
  position.mint = ZERO_BI
  position.createdAtTimestamp = event.block.timestamp
  position.createdAtBlockNumber = event.block.number
  position.transaction = loadTransaction(event).id

  // @TO-DO: pass in market contract to load market
  // @TO-DO: update oiLong, oiShort
  let marketContract = OverlayV1Market.bind(Address.fromString(market.id))
  let {value0: oiLong, value1: oiShort} = oiStateContract.ois(marketContract.feed())
  market.oiLong = oiLong
  market.oiShort = oiShort


  // @TO-DO: events to be grouped with position
  let transaction = loadTransaction(event)
  let build = new Build(sender.toHexString())
  build.positionId = positionId.toHexString()
  build.currentOi = event.params.oi
  build.currentDebt = event.params.debt
  build.isLong = event.params.isLong
  build.price = event.params.price
  build.timestamp = transaction.timestamp
  build.transaction = transaction.id


  position.save()
  market.save()
  build.save()
}

export function handleUnwind(event: UnwindEvent): void {
  let market = loadMarket(event)
  let sender = event.params.sender
  let positionId = event.params.positionId

  let position = loadPosition(event, sender, market, positionId)

  // @TO-DO: update position using periphery
  position.currentOi = positionStateContract.oi(Address.fromString(market.feedAddress), sender, positionId)
  position.currentDebt = positionStateContract.debt(Address.fromString(market.feedAddress), sender, positionId)
  position.mint = position.mint.plus(event.params.mint)

  // @TO-DO: pass in market contract to load market
  // @TO-DO: update oiLong, oiShort
  let marketContract = OverlayV1Market.bind(Address.fromString(market.id))
  let {value0: oiLong, value1: oiShort} = oiStateContract.ois(marketContract.feed())
  market.oiLong = oiLong
  market.oiShort = oiShort

  position.save()
  market.save()
}

export function handleLiquidate(event: LiquidateEvent): void {
  let market = loadMarket(event)
  let sender = event.params.sender
  let positionId = event.params.positionId

  let position = loadPosition(event, sender, market, positionId)

  // @TO-DO: update position using periphery
  position.currentOi = positionStateContract.oi(Address.fromString(market.feedAddress), sender, positionId)
  position.currentDebt = positionStateContract.debt(Address.fromString(market.feedAddress), sender, positionId)
  position.mint = position.mint.plus(event.params.mint)
  position.isLiquidated = true

  // @TO-DO: pass in market contract to load market
  // @TO-DO: update oiLong, oiShort
  let marketContract = OverlayV1Market.bind(Address.fromString(market.id))
  let {value0: oiLong, value1: oiShort} = oiStateContract.ois(marketContract.feed())
  market.oiLong = oiLong
  market.oiShort = oiShort

  position.save()
  market.save()
}


export function handleFeeRecipientUpdated(event: FeeRecipientUpdated): void {
  let factoryAddress = event.address.toHexString()
  let factory = loadFactory(factoryAddress)
  factory.feeRecipient = event.params.recipient.toHexString()

  factory.save()
}

export function handleFeedFactoryAdded(event: FeedFactoryAdded): void {}


export function handleParamUpdated(event: ParamUpdated): void {}
