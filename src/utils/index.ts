import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { Market, Transaction } from '../../generated/schema'
import { OverlayV1Market } from '../../generated/templates/OverlayV1Market/OverlayV1Market'
import { integer } from '@protofire/subgraph-toolkit'

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
      let contract = OverlayV1Market.bind(event.address)
    }

    return market;
}