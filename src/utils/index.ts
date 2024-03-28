import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { Market, Transaction, Position, Factory, Account, Analytics } from '../../generated/schema'
import { OverlayV1Market } from '../../generated/templates/OverlayV1Market/OverlayV1Market'
import { OverlayV1Market as MarketTemplate } from '../../generated/templates';
import { integer } from '@protofire/subgraph-toolkit'
import { ZERO_BI, ZERO_BD, stateContract, factoryContract } from './constants'

export function loadTransaction(event: ethereum.Event): Transaction {
  let transaction = Transaction.load(event.transaction.hash.toHexString())

  if (transaction === null) {
    transaction = new Transaction(event.transaction.hash.toHexString())
    transaction.blockNumber = event.block.number
    transaction.timestamp = event.block.timestamp
    transaction.gasLimit = event.transaction.gasLimit
    transaction.gasPrice = event.transaction.gasPrice
  }

  return transaction as Transaction
}

export function loadFactory(factoryAddress: string): Factory {
  let factory = Factory.load(factoryAddress)
  if (factory === null) {
    factory = new Factory(factoryAddress)
    factory.marketCount = ZERO_BI
    factory.txCount = ZERO_BI
    factory.totalVolumeOVL = ZERO_BD
    factory.totalFeesOVL = ZERO_BD
    factory.totalValueLockedOVL = ZERO_BD
    factory.feeRecipient = factoryContract.feeRecipient().toHexString()
    factory.owner = factoryContract.deployer().toHexString()
  }

  return factory
}

export function loadMarket(event: ethereum.Event, marketAddress: Address): Market {
  let marketId = marketAddress.toHexString()
  let market = Market.load(marketId)

  // if market doesn't exist, initialize
  // and query contract storage for params
  if (market === null) {
    market = new Market(marketId)
    let marketContract = OverlayV1Market.bind(marketAddress)

    market.feedAddress = marketContract.feed().toHexString()
    market.factory = marketContract.factory().toHexString()

    market.createdAtTimestamp = event.block.timestamp
    market.createdAtBlockNumber = event.block.number
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
    market.isShutdown = false
    market.totalBuildFees = ZERO_BI
    market.numberOfBuilds = ZERO_BI
    market.totalUnwindFees = ZERO_BI
    market.numberOfUnwinds = ZERO_BI
    market.totalLiquidateFees = ZERO_BI
    market.numberOfLiquidates = ZERO_BI
    market.totalFees = ZERO_BI
    market.totalVolume = ZERO_BI

    MarketTemplate.create(marketAddress)
  }

  return market;
}

export function loadPosition(event: ethereum.Event, sender: Address, market: Market, positionId: BigInt): Position {
  let marketPositionId = market.id.concat('-').concat(positionId.toHexString())
  let marketAddress = Address.fromString(market.id)
  let position = Position.load(marketPositionId)

  // create new Position if null
  if (position === null) {
    position = new Position(marketPositionId)
    position.positionId = positionId.toHexString()
    position.owner = sender.toHexString()
    position.market = market.id

    position.initialOi = stateContract.oi(marketAddress, sender, positionId)
    position.initialDebt = stateContract.debt(marketAddress, sender, positionId)
    
    let initialCollateral = stateContract.cost(marketAddress, sender, positionId)
    let initialDebt = stateContract.debt(marketAddress, sender, positionId)
    let initialNotional = initialCollateral.plus(initialDebt)
    position.initialCollateral = initialCollateral
    position.initialNotional = initialNotional
    position.leverage = (initialNotional.div(initialCollateral)).toBigDecimal()

    let isLong = stateContract.position(marketAddress, sender, positionId).isLong
    position.isLong = isLong

    if (isLong === true) {
      let askPrice = stateContract.prices(marketAddress).value1
      position.entryPrice = askPrice
    } else {
      let bidPrice = stateContract.prices(marketAddress).value0
      position.entryPrice = bidPrice
    }

    position.isLiquidated = false
    position.currentOi = stateContract.oi(marketAddress, sender, positionId)
    position.currentDebt = stateContract.debt(marketAddress, sender, positionId)
    position.mint = ZERO_BI
    
    position.createdAtTimestamp = event.block.timestamp
    position.createdAtBlockNumber = event.block.number
  }

  return position
}

export function loadAccount(accountAddress: Address): Account {
  let accountId = accountAddress.toHexString()
  let account = Account.load(accountId)

  if (account === null) {
    account = new Account(accountId)

    account.realizedPnl = ZERO_BI
    account.numberOfUnwinds = ZERO_BI
    account.numberOfOpenPositions = ZERO_BI
    account.numberOfLiquidatedPositions = ZERO_BI
    account.planckCatBalance = ZERO_BI
    account.ovlVolumeTraded = ZERO_BI
  }

  return account
}

export function loadAnalytics(factory: string): Analytics {
  let analyticsId = factory
  let analytics = Analytics.load(analyticsId)

  if (analytics === null) {
    analytics = new Analytics(analyticsId)


    analytics.totalUsers = ZERO_BI
    analytics.totalTransactions = ZERO_BI
    analytics.totalTokensLocked = ZERO_BI
    analytics.totalVolumeBuilds = ZERO_BI
    analytics.totalVolumeUnwinds = ZERO_BI
    analytics.totalVolumeLiquidations = ZERO_BI
    analytics.totalVolume = ZERO_BI
  }

  return analytics
}