import { Address, BigInt, log } from "@graphprotocol/graph-ts"
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

import { Factory, Market, Position, Build, Unwind, Liquidate } from "../generated/schema"
import { OverlayV1Market as MarketTemplate } from './../generated/templates';
import { FACTORY_ADDRESS, ZERO_BI, ONE_BI, ZERO_BD, ADDRESS_ZERO, factoryContract, stateContract, RISK_PARAMS, PERIPHERY_ADDRESS } from "./utils/constants"
import { loadMarket, loadPosition, loadFactory, loadTransaction, loadAccount } from "./utils";

export function handleMarketDeployed(event: MarketDeployed): void {
  
  // load factory
  let factory = Factory.load(FACTORY_ADDRESS)
  if (factory === null) {
    factory = new Factory(FACTORY_ADDRESS)
    factory.marketCount = ZERO_BI
    // @TO-DO: calculate global factory values below
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

  let marketAddress = event.params.market
  let feedAddress = event.params.feed
  let marketContract = OverlayV1Market.bind(event.params.market)
  let market = new Market(marketAddress.toHexString()) as Market

  market.feedAddress = feedAddress.toHexString()
  market.factory = factory.id
  market.createdAtTimestamp = event.block.timestamp
  market.createdAtBlockNumber = event.block.number
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
  market.oiLong = stateContract.ois(marketAddress).value0
  market.oiShort = stateContract.ois(marketAddress).value1

  market.save()
  // create tracked market contract based on template
  MarketTemplate.create(event.params.market)
  factory.save()
}

export function handleBuild(event: BuildEvent): void {
  let market = loadMarket(event, event.address)
  let sender = loadAccount(event.params.sender)

  let marketAddress = Address.fromString(market.id)
  let senderAddress = Address.fromString(sender.id)

  let positionId = event.params.positionId
  let id = market.id.concat('-').concat(positionId.toHexString())
  let position = new Position(id) as Position
  
  position.owner = sender.id
  position.positionId = positionId.toHexString()
  // @TO-DO: check if below passes in market contract address
  position.market = market.id
  position.initialOi = event.params.oi
  position.initialDebt = event.params.debt

  let initialCollateral = stateContract.cost(marketAddress, senderAddress, positionId)
  // let initialNotional = stateContract.notional(marketAddress, senderAddress, positionId)
  let initialNotional = initialCollateral.plus(event.params.debt)
  position.initialCollateral = initialCollateral
  position.initialNotional = initialNotional
  // position.leverage = (initialNotional.div(initialCollateral)).toBigDecimal()
  position.leverage = (initialNotional.toBigDecimal()).div(initialCollateral.toBigDecimal())
  position.isLong = event.params.isLong
  position.entryPrice = event.params.price
  position.isLiquidated = false
  position.currentOi = event.params.oi
  position.currentDebt = event.params.debt
  // @TO-DO: pass in leverage position built with
  position.mint = ZERO_BI
  position.createdAtTimestamp = event.block.timestamp
  position.createdAtBlockNumber = event.block.number
  position.transaction = loadTransaction(event).id

  // @TO-DO: pass in market contract to load market
  // @TO-DO: update oiLong, oiShort
  market.oiLong = stateContract.ois(marketAddress).value0
  market.oiShort = stateContract.ois(marketAddress).value1


  // @TO-DO: events to be grouped with position
  let transaction = loadTransaction(event)
  let build = new Build(sender.id) as Build

  build.positionId = positionId.toHexString()
  build.owner = sender.id
  build.currentOi = event.params.oi
  build.currentDebt = event.params.debt
  build.isLong = event.params.isLong
  build.price = event.params.price
  build.collateral = stateContract.collateral(marketAddress, senderAddress, positionId)
  build.value = stateContract.value(marketAddress, senderAddress, positionId)
  build.timestamp = transaction.timestamp
  build.transaction = transaction.id


  position.save()
  market.save()
  build.save()
  sender.save()
  transaction.save()
}

export function handleUnwind(event: UnwindEvent): void {
  let market = loadMarket(event, event.address)
  let sender = loadAccount(event.params.sender)
  
  let marketAddress = Address.fromString(market.id)
  let senderAddress = Address.fromString(sender.id)
  
  let positionId = event.params.positionId
  let position = loadPosition(event, senderAddress, market, positionId)

  // @TO-DO: update position using periphery
  position.currentOi = stateContract.oi(marketAddress, senderAddress, positionId)
  position.currentDebt = stateContract.debt(marketAddress, senderAddress, positionId)
  position.mint = position.mint.plus(event.params.mint)

  // @TO-DO: pass in market contract to load market
  // @TO-DO: update oiLong, oiShort
  market.oiLong = stateContract.ois(marketAddress).value0
  market.oiShort = stateContract.ois(marketAddress).value1

  // @TO-DO: events to be grouped with position
  let transaction = loadTransaction(event)
  let unwind = new Unwind(sender.id) as Unwind

  unwind.positionId = positionId.toHexString()
  unwind.owner = sender.id
  unwind.currentOi = stateContract.oi(marketAddress, senderAddress, positionId)
  unwind.currentDebt = stateContract.debt(marketAddress, senderAddress, positionId)
  unwind.isLong = stateContract.position(marketAddress, senderAddress, positionId).isLong
  unwind.price = event.params.price
  unwind.collateral = stateContract.collateral(marketAddress, senderAddress, positionId)
  unwind.value = stateContract.value(marketAddress, senderAddress, positionId)
  unwind.timestamp = transaction.timestamp
  unwind.transaction = transaction.id

  position.save()
  market.save()
  unwind.save()
  sender.save()
  transaction.save()
}

export function handleLiquidate(event: LiquidateEvent): void {
  let market = loadMarket(event, event.address)
  let sender = loadAccount(event.params.sender)

  let marketAddress = Address.fromString(market.id)
  let senderAddress = Address.fromString(sender.id)

  let positionId = event.params.positionId
  let position = loadPosition(event, senderAddress, market, positionId)

  // @TO-DO: update position using periphery
  position.currentOi = stateContract.oi(marketAddress, senderAddress, positionId)
  position.currentDebt = stateContract.debt(marketAddress, senderAddress, positionId)
  position.mint = position.mint.plus(event.params.mint)
  position.isLiquidated = true

  // @TO-DO: pass in market contract to load market
  // @TO-DO: update oiLong, oiShort
  market.oiLong = stateContract.ois(marketAddress).value0
  market.oiShort = stateContract.ois(marketAddress).value1

  // @TO-DO: events to be grouped with position
  let transaction = loadTransaction(event)
  let liquidate = new Liquidate(sender.id) as Liquidate

  liquidate.positionId = positionId.toHexString()
  liquidate.owner = sender.id
  liquidate.currentOi = stateContract.oi(marketAddress, senderAddress, positionId)
  liquidate.currentDebt = stateContract.debt(marketAddress, senderAddress, positionId)
  liquidate.isLong = stateContract.position(marketAddress, senderAddress, positionId).isLong
  liquidate.price = event.params.price
  liquidate.collateral = stateContract.collateral(marketAddress, senderAddress, positionId)
  liquidate.value = stateContract.value(marketAddress, senderAddress, positionId)
  liquidate.timestamp = transaction.timestamp
  liquidate.transaction = transaction.id

  position.save()
  market.save()
  liquidate.save()
  sender.save()
  transaction.save()
}


export function handleFeeRecipientUpdated(event: FeeRecipientUpdated): void {
  let factoryAddress = event.address.toHexString()
  let factory = loadFactory(factoryAddress)
  factory.feeRecipient = event.params.recipient.toHexString()

  factory.save()
}

export function handleFeedFactoryAdded(event: FeedFactoryAdded): void {}


export function handleParamUpdated(event: ParamUpdated): void {
  let market = loadMarket(event, event.params.market)
  let riskParamIndex = event.params.name
  let updateValue = event.params.value

  if (riskParamIndex === RISK_PARAMS.k) market.k = updateValue
  if (riskParamIndex === RISK_PARAMS.lmbda) market.lmbda = updateValue
  if (riskParamIndex === RISK_PARAMS.delta) market.delta = updateValue
  if (riskParamIndex === RISK_PARAMS.capPayoff) market.capPayoff = updateValue
  if (riskParamIndex === RISK_PARAMS.capLeverage) market.capLeverage = updateValue
  if (riskParamIndex === RISK_PARAMS.circuitBreakerWindow) market.circuitBreakerWindow = updateValue
  if (riskParamIndex === RISK_PARAMS.circuitBreakerMintTarget) market.circuitBreakerMintTarget = updateValue
  if (riskParamIndex === RISK_PARAMS.maintenanceMarginFraction) market.maintenanceMarginFraction = updateValue
  if (riskParamIndex === RISK_PARAMS.maintenanceMarginBurnRate) market.maintenanceMarginBurnRate = updateValue
  if (riskParamIndex === RISK_PARAMS.liquidationFeeRate) market.liquidationFeeRate = updateValue
  if (riskParamIndex === RISK_PARAMS.tradingFeeRate) market.tradingFeeRate = updateValue
  if (riskParamIndex === RISK_PARAMS.minCollateral) market.minCollateral = updateValue
  if (riskParamIndex === RISK_PARAMS.priceDriftUpperLimit) market.priceDriftUpperLimit = updateValue
  if (riskParamIndex === RISK_PARAMS.averageBlockTime) market.averageBlockTime = updateValue

  market.save()
}
