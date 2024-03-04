import { Address } from '@graphprotocol/graph-ts'

import {
    Transfer as TransferEvent,
    OverlayV1Token as OverlayV1TokenContract
} from "../generated/OverlayV1Token/OverlayV1Token"
import { NIP as NIPContract } from "../generated/NIP/NIP"
import { ERC20Token, TokenPosition, TokenTransfer, TotalSupplyHourData } from "../generated/schema"
import { loadTransaction, loadAccount } from "./utils"
import { ZERO_BI, ADDRESS_ZERO } from "./utils/constants"

export function handleTransfer(event: TransferEvent, token: ERC20Token): void {
    const from = event.params.from.toHexString()
    const to = event.params.to.toHexString()
    const amount = event.params.value

    // If minting or burning, update total supply
    if (from == ADDRESS_ZERO || to == ADDRESS_ZERO) {
        token.totalSupply = from == ADDRESS_ZERO
            ? token.totalSupply.plus(amount)
            : token.totalSupply.minus(amount)
        token.save()
        updateTotalSupplyHourData(token, event)
    }

    // Create transfer entity
    const transfer = new TokenTransfer(
        event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    const tx = loadTransaction(event)
    transfer.token = event.address
    transfer.from = event.params.from
    transfer.to = event.params.to
    transfer.amount = amount
    transfer.transaction = tx.id

    // Update balances, but exclude zero address
    if (from != ADDRESS_ZERO) {
        const tokenPosition = loadTokenPosition(event.address, event.params.from)
        tokenPosition.balance = tokenPosition.balance.minus(amount)
        tokenPosition.save()
    }

    if (to != ADDRESS_ZERO) {
        const tokenPosition = loadTokenPosition(event.address, event.params.to)
        tokenPosition.balance = tokenPosition.balance.plus(amount)
        tokenPosition.save()
    }

    transfer.save()
    tx.save()
}

export function handleTransferOVL(event: TransferEvent): void {
    let token = ERC20Token.load(event.address)
    if (token == null) {
        const contract = OverlayV1TokenContract.bind(event.address)
        token = new ERC20Token(event.address)
        token.totalSupply = ZERO_BI
        token.name = contract.name()
        token.symbol = contract.symbol()
    }
    handleTransfer(event, token)
}

export function handleTransferNIP(event: TransferEvent): void {
    let token = ERC20Token.load(event.address)
    if (token == null) {
        const contract = NIPContract.bind(event.address)
        token = new ERC20Token(event.address)
        token.totalSupply = ZERO_BI
        token.name = contract.name()
        token.symbol = contract.symbol()
    }
    handleTransfer(event, token)
}

function loadTokenPosition(token: Address, owner: Address): TokenPosition {
    const account = loadAccount(owner)
    account.save() // ensure account exists

    let tokenPosition = TokenPosition.load(token.concat(owner))
    if (tokenPosition == null) {
        tokenPosition = new TokenPosition(token.concat(owner))
        tokenPosition.token = token
        tokenPosition.owner = account.id
        tokenPosition.balance = ZERO_BI
    }

    return tokenPosition
}

export function updateTotalSupplyHourData(token: ERC20Token, event: TransferEvent) {
    let timestamp = event.block.timestamp.toI32()
    let hourIndex = timestamp / 3600 // get unique hour within unix history
    let hourStartUnix = hourIndex * 3600 // want the rounded effect
    let tokenHourID = token.id
      .toString()
      .concat('-')
      .concat(hourIndex.toString())
    let totalSupplyHourData = TotalSupplyHourData.load(tokenHourID)
    let totalSupply = token.totalSupply
  
    if (totalSupplyHourData === null) {
      totalSupplyHourData = new TotalSupplyHourData(tokenHourID)
      totalSupplyHourData.periodStartUnix = hourStartUnix
      totalSupplyHourData.token = token.id
      totalSupplyHourData.minted = ZERO_BI
      totalSupplyHourData.burnt = ZERO_BI
      totalSupplyHourData.open = totalSupply
      totalSupplyHourData.high = totalSupply
      totalSupplyHourData.low = totalSupply
      totalSupplyHourData.close = totalSupply
    }

    const from = event.params.from.toHexString()
    const amount = event.params.value
    if (from == ADDRESS_ZERO) {
      totalSupplyHourData.minted = totalSupplyHourData.minted.plus(amount)
    } else { // can do just else because updateTotalSupplyHourData is called only when minting or burning tokens
      totalSupplyHourData.burnt = totalSupplyHourData.burnt.plus(amount)
    }
  
    if (totalSupply.gt(totalSupplyHourData.high)) {
      totalSupplyHourData.high = totalSupply
    }
  
    if (totalSupply.lt(totalSupplyHourData.low)) {
      totalSupplyHourData.low = totalSupply
    }
  
    totalSupplyHourData.close = totalSupply
    totalSupplyHourData.save()
}