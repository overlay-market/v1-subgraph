import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { Market, Transaction, Position, Factory, Account } from '../../generated/schema'
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

// @TO-DO: loadFactory to load factory based on address
export function loadFactory(factoryAddress: string): Factory {
  let factory = Factory.load(factoryAddress)
  if (factory === null) {
    factory = new Factory(factoryAddress)
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

  return factory
}

// @TO-DO: loadMarket util function to load market based on contract address
// can we call multiple contract view functions in a single handler function?
export function loadMarket(event: ethereum.Event, marketAddress: Address): Market {
  let marketId = marketAddress.toHexString()
  let market = Market.load(marketId)

  // if market doesn't exist, initialize
  // and query contract storage for params
  if (market === null) {
    market = new Market(marketId)
    let marketContract = OverlayV1Market.bind(marketAddress)

    // @TO-DO: create feed entity
    market.feedAddress = marketContract.feed().toHexString()
    // @TO-DO: load factory to pass in instead of using string
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
    // @TO-DO: calculate current total oi based on oiState
    market.oiLong = stateContract.ois(marketAddress).value0
    market.oiShort = stateContract.ois(marketAddress).value1

    MarketTemplate.create(marketAddress)
  }

  return market;
}

// @TO-DO: create function to load position based on market address and position id
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

    // @TO-DO: check stateContract pulls proper position info
    position.initialOi = stateContract.oi(marketAddress, sender, positionId)
    position.initialDebt = stateContract.debt(marketAddress, sender, positionId)
    
    let initialCollateral = stateContract.cost(marketAddress, sender, positionId)
    let initialDebt = stateContract.debt(marketAddress, sender, positionId)
    // let initialNotional = stateContract.notional(marketAddress, sender, positionId)
    let initialNotional = initialCollateral.plus(initialDebt)
    position.initialCollateral = initialCollateral
    position.initialNotional = initialNotional
    position.leverage = (initialNotional.div(initialCollateral)).toBigDecimal()

    // @TO-DO: pull position isLong value from periphery
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
  }

  return account
}