import { Address, BigInt } from '@graphprotocol/graph-ts'

import {
    Transfer as TransferEvent,
    PlanckCat as PlanckCatContract
} from "../generated/PlanckCat/PlanckCat"
import { ERC721Token, ERC721NFT, ERC721Transfer } from "../generated/schema"
import { loadAccount, loadTransaction } from "./utils"
import { ZERO_BI, ADDRESS_ZERO } from "./utils/constants"

export function handleTransfer(event: TransferEvent): void {
    const token = loadErc721Token(event.address)
    const from = loadAccount(event.params.from)
    const to = loadAccount(event.params.to)
    const tokenId = event.params.tokenId

    // If minting or burning, update total supply
    if (from.id == ADDRESS_ZERO || to.id == ADDRESS_ZERO) {
        token.totalSupply = from.id == ADDRESS_ZERO
            ? token.totalSupply.plus(BigInt.fromI32(1))
            : token.totalSupply.minus(BigInt.fromI32(1))
        token.save()
    }

    // Create transfer entity
    const transfer = new ERC721Transfer(
        event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    const tx = loadTransaction(event)
    transfer.nft = event.address.concatI32(tokenId.toI32())
    transfer.from = from.id
    transfer.to = to.id
    transfer.transaction = tx.id

    const nft = loadNft(event.address, tokenId)
    nft.owner = to.id

    // Update balances, but exclude zero address
    if (from.id != ADDRESS_ZERO)
        from.planckCatBalance = from.planckCatBalance.minus(BigInt.fromI32(1))
    if (to.id != ADDRESS_ZERO)
        to.planckCatBalance = to.planckCatBalance.plus(BigInt.fromI32(1))

    from.save()
    to.save()
    transfer.save()
    tx.save()
    nft.save()
}

function loadErc721Token(address: Address): ERC721Token {
    let token = ERC721Token.load(address)
    if (token == null) {
        const contract = PlanckCatContract.bind(address)
        token = new ERC721Token(address)
        token.totalSupply = ZERO_BI
        token.name = contract.name()
        token.symbol = contract.symbol()
    }
    return token
}

function loadNft(contract: Address, tokenId: BigInt): ERC721NFT {
    let nft = ERC721NFT.load(contract.concatI32(tokenId.toI32()))
    if (nft == null) {
        nft = new ERC721NFT(contract.concatI32(tokenId.toI32()))
        nft.contract = contract
        nft.tokenId = tokenId
        nft.owner = ADDRESS_ZERO
    }
    return nft
}
