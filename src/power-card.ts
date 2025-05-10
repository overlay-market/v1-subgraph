import { Address, BigInt, Bytes, ethereum, log } from '@graphprotocol/graph-ts'

import {
  TransferSingle as TransferSingleEvent,
  TransferBatch as TransferBatchEvent,
  URI as URIEvent
} from "../generated/PowerCard/PowerCard"
import { Account, ERC1155Token, ERC1155TokenBalance, ERC1155Transfer } from "../generated/schema"
import { loadAccount, loadTransaction } from "./utils"
import { ZERO_BI, ADDRESS_ZERO } from "./utils/constants"

const ADDRESS_ZERO_AS_BYTES = Bytes.fromHexString(ADDRESS_ZERO);

export function handleTransferSingle(event: TransferSingleEvent): void {
  const from = loadAccount(event.params.from)
  const to = loadAccount(event.params.to)
  const tokenAddress = event.address
  const tokenId = event.params.id
  const value = event.params.value

  handleTransferSingleInternal(from, to, tokenAddress, tokenId, value, event, 0)

  from.save()
  to.save()
}

export function handleTransferBatch(event: TransferBatchEvent): void {
  const from = loadAccount(event.params.from)
  const to = loadAccount(event.params.to)
  const tokenIds = event.params.ids
  const tokenAddress = event.address
  const values = event.params.values
  const trasfersCount = tokenIds.length;

  for (let i = 0; i < trasfersCount; i++) {
    handleTransferSingleInternal(from, to, tokenAddress, tokenIds[i], values[i], event, i)
  }

  from.save()
  to.save()
}

export function handleURIChange(event: URIEvent): void {
  const tokenAddress = event.address
  const tokenId = event.params.id

  const erc1155Token = loadERC1155Token(tokenAddress, tokenId)

  erc1155Token.tokenUri = event.params.value;

  erc1155Token.save();
}

function handleTransferSingleInternal(from: Account, to: Account, tokenAddress: Address, tokenId: BigInt, value: BigInt, event: ethereum.Event, index: i32): void {
  const erc1155TokenBalanceFrom = loadERC1155TokenBalance(tokenAddress, tokenId, from)
  const erc1155TokenBalanceTo = loadERC1155TokenBalance(tokenAddress, tokenId, to)

  if (from.id == ADDRESS_ZERO_AS_BYTES) {
    handleMinted(to, tokenAddress, tokenId, value);
  } else if (to.id == ADDRESS_ZERO_AS_BYTES) { // log.warning("Entering handleBurnt: user {}, tokenId {}, value {}", [to.toString(), tokenId.toString(), value.toString()]);
    handleBurnt(from, tokenAddress, tokenId, value);
  } else {
    erc1155TokenBalanceFrom.amount = erc1155TokenBalanceFrom.amount.minus(value);
    erc1155TokenBalanceTo.amount = erc1155TokenBalanceTo.amount.plus(value);

    erc1155TokenBalanceFrom.save();
    erc1155TokenBalanceTo.save();
  }

  createERC1155Transfer(from, to, tokenAddress, tokenId, value, event, index);
}

function handleBurnt(owner: Account, tokenAddress: Address, tokenId: BigInt, value: BigInt): void {
  const erc1155Token = loadERC1155Token(tokenAddress, tokenId)
  const erc1155TokenBalance = loadERC1155TokenBalance(tokenAddress, tokenId, owner)

  erc1155Token.totalSupply = erc1155Token.totalSupply.minus(value)
  erc1155Token.totalBurnt = erc1155Token.totalBurnt.plus(value)

  erc1155TokenBalance.amount = erc1155TokenBalance.amount.minus(value);
  erc1155TokenBalance.burnt = erc1155TokenBalance.burnt.plus(value);

  erc1155Token.save()
  erc1155TokenBalance.save();
}

function handleMinted(owner: Account, tokenAddress: Address, tokenId: BigInt, value: BigInt): void {
  const erc1155Token = loadERC1155Token(tokenAddress, tokenId)
  const erc1155TokenBalance = loadERC1155TokenBalance(tokenAddress, tokenId, owner)

  erc1155Token.totalSupply = erc1155Token.totalSupply.plus(value)

  erc1155TokenBalance.amount = erc1155TokenBalance.amount.plus(value);

  erc1155Token.save()
  erc1155TokenBalance.save();
}

function loadERC1155TokenBalance(tokenAddress: Address, tokenId: BigInt, owner: Account): ERC1155TokenBalance {
  let erc1155TokenBalanceId = tokenAddress.concatI32(tokenId.toI32()).concat(owner.id);
  let erc1155TokenBalance = ERC1155TokenBalance.load(erc1155TokenBalanceId);
  if (erc1155TokenBalance === null) {
    erc1155TokenBalance = new ERC1155TokenBalance(erc1155TokenBalanceId)

    erc1155TokenBalance.owner = owner.id
    erc1155TokenBalance.token = loadERC1155Token(tokenAddress, tokenId).id
    erc1155TokenBalance.amount = ZERO_BI
    erc1155TokenBalance.burnt = ZERO_BI

    erc1155TokenBalance.save()
  }

  return erc1155TokenBalance;
}

function loadERC1155Token(tokenAddress: Address, tokenId: BigInt): ERC1155Token {
  let erc1155TokenId = tokenAddress.concatI32(tokenId.toI32());
  let erc1155Token = ERC1155Token.load(erc1155TokenId);

  if (erc1155Token === null) {
    erc1155Token = new ERC1155Token(erc1155TokenId)

    erc1155Token.address = tokenAddress.toHexString()
    erc1155Token.tokenId = tokenId
    erc1155Token.totalSupply = ZERO_BI
    erc1155Token.totalBurnt = ZERO_BI
    erc1155Token.tokenUri = ''

    erc1155Token.save()
  }

  return erc1155Token;
}

function createERC1155Transfer(from: Account, to: Account, tokenAddress: Address, tokenId: BigInt, value: BigInt, event: ethereum.Event, index: i32): void {
  const transferId = event.transaction.hash.concatI32(event.logIndex.toI32()).concatI32(index);
  const transfer = new ERC1155Transfer(transferId);

  transfer.token = loadERC1155Token(tokenAddress, tokenId).id;
  transfer.from = from.id;
  transfer.to = to.id;
  transfer.amount = value;
  transfer.transaction = loadTransaction(event).id;


  transfer.save();
}