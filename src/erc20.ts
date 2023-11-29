import { Address } from '@graphprotocol/graph-ts'

import {
    Transfer as TransferEvent,
    OverlayV1Token as OverlayV1TokenContract
} from "../generated/OverlayV1Token/OverlayV1Token"
import { NIP as NIPContract } from "../generated/NIP/NIP"
import { ERC20Token, TokenPosition, TokenTransfer } from "../generated/schema"
import { loadTransaction, loadAccount } from "./utils"
import { ZERO_BI, ADDRESS_ZERO, REFERRAL_ADDRESS } from "./utils/constants"
import { loadReferralProgram, loadReferralPosition, updateAirdrop } from './referral'

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

    // Update airdropped amounts for the referral program
    if (from == REFERRAL_ADDRESS) {
        updateAirdrop(event, event.params.to, amount, transfer.id)
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
