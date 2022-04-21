import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { Market, Transaction } from '../../generated/schema'
import { OverlayV1Market } from '../../generated/templates/OverlayV1Market/OverlayV1Market'
import { integer } from '@protofire/subgraph-toolkit'
import { ZERO_BI } from './constants'

export function loadTransaction(event: ethereum.Event): Transaction {
  let transaction = Transaction.load(event.transaction.hash.toHexString())
  if (transaction === null) {
    transaction = new Transaction(event.transaction.hash.toHexString())
  }
  transaction.blockNumber = event.block.number
  transaction.timestamp = event.block.timestamp
  transaction.gasLimit = event.transaction.gasLimit
  transaction.gasPrice = event.transaction.gasPrice
  transaction.save()
  return transaction as Transaction
}

// @TO-DO: loadMarket util function to load market based on contract address
// can we call multiple contract view functions in a single handler function?
export function loadMarket(event: ethereum.Event): Market | null{
    let marketAddress = event.address.toHexString()
    let market = Market.load(marketAddress)

    // if market doesn't exist, initialize
    // and query contract storage for params
    if (market === null) {
      market = new Market(marketAddress)
      let marketContract = OverlayV1Market.bind(event.address)

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
      // @TO-DO: calculate current total oi based on 
      // oiLong(), oiShort(), oiLongShares(), oiShortShares()
      market.totalOi = ZERO_BI
    }

    return market;
}