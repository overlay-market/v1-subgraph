import { BigInt } from "@graphprotocol/graph-ts"
import {
  OverlayV1Factory,
  FeeRecipientUpdated,
  FeedFactoryAdded,
  MarketDeployed,
  ParamUpdated
} from "../generated/OverlayV1Factory/OverlayV1Factory"
import { Factory, Market } from "../generated/schema"
import { OverlayV1Market as MarketTemplate } from './../generated/templates';
import { FACTORY_ADDRESS, ZERO_BI, ONE_BI, ZERO_BD, ADDRESS_ZERO } from "./utils/constants"

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
  market.factoryAddress = factory.id
  market.createdAtTimestamp = event.block.timestamp
  market.createdAtBlockNumber = event.block.number
  // @TO-DO: pass in token symbol string OR contract address
  market.baseToken = ADDRESS_ZERO
  market.quoteToken = ADDRESS_ZERO
  // @TO-DO: require event to pass back market params
  market.k = ZERO_BI
  market.lmbda = ZERO_BI
  market.delta = ZERO_BI
  market.capPayoff = ZERO_BI
  market.capNotional = ZERO_BI
  market.capLeverage = ZERO_BI
  market.circuitBreakingWindow = ZERO_BI
  market.maintenanceMarginFraction = ZERO_BI
  market.maintenanceMarginBurnRate = ZERO_BI
  market.liquidationFeeRate = ZERO_BI
  market.tradingFeeRate = ZERO_BI
  market.minCollateral = ZERO_BI
  market.priceDriftUpperLimit = ZERO_BI

  market.save()
  // create tracked market contract based on template
  MarketTemplate.create(event.params.market)
  factory.save()
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
