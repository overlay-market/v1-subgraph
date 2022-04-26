import { Address, BigInt } from "@graphprotocol/graph-ts"
import {
  OverlayV1Factory,
  FeeRecipientUpdated,
  FeedFactoryAdded,
  MarketDeployed,
  ParamUpdated
} from "../generated/OverlayV1Factory/OverlayV1Factory"
import {
  OverlayV1Market,
  Build,
  Liquidate,
  Unwind
} from "../generated/templates/OverlayV1Market/OverlayV1Market";
import { Factory, Market, Position } from "../generated/schema"
import { OverlayV1Market as MarketTemplate } from './../generated/templates';
import { FACTORY_ADDRESS, ZERO_BI, ONE_BI, ZERO_BD, ADDRESS_ZERO, positionStateContract, factoryContract, oiStateContract } from "./utils/constants"
import { loadMarket, loadPosition } from "./utils";



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
    factory.feeRecipient = ADDRESS_ZERO
    // @TO-DO: check if owner field is needed
    factory.owner = ADDRESS_ZERO
  }

  factory.marketCount = factory.marketCount.plus(ONE_BI)

  let market = new Market(event.params.market.toHexString()) as Market
  market.feedAddress = event.params.feed.toHexString()
  market.factory = factory.id
  market.createdAtTimestamp = event.block.timestamp
  market.createdAtBlockNumber = event.block.number
  // @TO-DO: pass in token symbol string OR contract address
  // market.baseToken = ADDRESS_ZERO
  // market.quoteToken = ADDRESS_ZERO
  // @TO-DO: require event to pass back market params
  market.k = ZERO_BI
  market.lmbda = ZERO_BI
  market.delta = ZERO_BI
  market.capPayoff = ZERO_BI
  market.capNotional = ZERO_BI
  market.capLeverage = ZERO_BI
  market.circuitBreakerWindow = ZERO_BI
  market.circuitBreakerMintTarget = ZERO_BI
  market.maintenanceMarginFraction = ZERO_BI
  market.maintenanceMarginBurnRate = ZERO_BI
  market.liquidationFeeRate = ZERO_BI
  market.tradingFeeRate = ZERO_BI
  market.minCollateral = ZERO_BI
  market.priceDriftUpperLimit = ZERO_BI
  market.averageBlockTime = ZERO_BI
  market.oiLong = ZERO_BI
  market.oiShort = ZERO_BI

  market.save()
  // create tracked market contract based on template
  MarketTemplate.create(event.params.market)
  factory.save()
}

export function handleBuild(event: Build): void {
  let market = loadMarket(event)
  let positionId = event.params.positionId
  let id = market.id.concat('-').concat(positionId.toHexString())
  let position = new Position(id) as Position
  
  position.owner = event.params.sender.toHexString()
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

  // @TO-DO: pass in market contract to load market
  // @TO-DO: update oiLong, oiShort
  let marketContract = OverlayV1Market.bind(Address.fromString(market.id))
  let {value0: oiLong, value1: oiShort} = oiStateContract.ois(marketContract.feed())
  market.oiLong = oiLong
  market.oiShort = oiShort


  position.save()
  market.save()
}

export function handleUnwind(event: Unwind): void {
  let market = loadMarket(event)
  let sender = event.params.sender
  let positionId = event.params.positionId

  let position = loadPosition(event, sender, market, positionId)

  // @TO-DO: update position using periphery
  position.currentOi = positionStateContract.oi(Address.fromString(market.feedAddress), sender, positionId)
  position.currentDebt = positionStateContract.debt(Address.fromString(market.feedAddress), sender, positionId)
  position.mint = position.mint.plus(event.params.mint)

  position.save()
}

export function handleLiquidate(event: Liquidate): void {
  let market = loadMarket(event)
  let sender = event.params.sender
  let positionId = event.params.positionId

  let position = loadPosition(event, sender, market, positionId)

  // @TO-DO: update position using periphery
  position.currentOi = positionStateContract.oi(Address.fromString(market.feedAddress), sender, positionId)
  position.currentDebt = positionStateContract.debt(Address.fromString(market.feedAddress), sender, positionId)
  position.mint = position.mint.plus(event.params.mint)
  position.isLiquidated = true

  position.save()
}


export function handleFeeRecipientUpdated(event: FeeRecipientUpdated): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  // let entity = ExampleEntity.load(event.transaction.from.toHex())

  // // Entities only exist after they have been saved to the store;
  // // `null` checks allow to create entities on demand
  // if (!entity) {
  //   entity = new ExampleEntity(event.transaction.from.toHex())

  //   // Entity fields can be set using simple assignments
  //   entity.count = BigInt.fromI32(0)
  // }

  // // BigInt and BigDecimal math are supported
  // entity.count = entity.count + BigInt.fromI32(1)

  // // Entity fields can be set based on event parameters
  // entity.user = event.params.user
  // entity.recipient = event.params.recipient

  // // Entities can be written to the store with `.save()`
  // entity.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.PARAMS_MAX(...)
  // - contract.PARAMS_MIN(...)
  // - contract.deployMarket(...)
  // - contract.deployer(...)
  // - contract.feeRecipient(...)
  // - contract.getMarket(...)
  // - contract.isFeedFactory(...)
  // - contract.isMarket(...)
  // - contract.ovl(...)
}

export function handleFeedFactoryAdded(event: FeedFactoryAdded): void {}


export function handleParamUpdated(event: ParamUpdated): void {}
