import {
  assert,
  describe,
  test,
  clearStore,
  beforeEach,
  afterEach,
} from "matchstick-as/assembly/index"
import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"

import {
  TransferSingle as TransferSingleEvent,
} from "../../../generated/PowerCard/PowerCard"
import { ZERO_ADDRESS } from "@protofire/subgraph-toolkit"

const user1Address = Address.fromString("0x0000000000000000000000000000000000000011")
const user2Address = Address.fromString("0x0000000000000000000000000000000000000012")
const tokenId = BigInt.fromI32(234)
const tokenAddress = Address.fromString("0x0000000000000000000000000000000000000013")
const amount = BigInt.fromI32(5)
const zeroAddress = Address.fromString(ZERO_ADDRESS)

let transferSingleEvent: TransferSingleEvent

describe("Transfer Single event", () => {
  describe("Minting", () => {
    beforeEach(() => {
      singleTransfer(zeroAddress, user1Address);
    })

    afterEach(() => {
      clearStore()
    })

    test("creates ERC1155Token entity with correct data", () => {
      const erc155TokenId = tokenAddress.concatI32(tokenId.toI32()).toHexString()

      assert.fieldEquals("ERC1155Token", erc155TokenId, "address", tokenAddress.toHexString())
      assert.fieldEquals("ERC1155Token", erc155TokenId, "tokenId", tokenId.toString())
      assert.fieldEquals("ERC1155Token", erc155TokenId, "totalSupply", amount.toString())
      assert.fieldEquals("ERC1155Token", erc155TokenId, "totalBurnt", "0")
    })

    test("creates ERC1155TokenBalance entity with correct data", () => {
      const tokenBalanceId = tokenAddress.concatI32(tokenId.toI32()).concat(user1Address).toHexString()

      assert.fieldEquals("ERC1155TokenBalance", tokenBalanceId, "owner", user1Address.toHexString())
      assert.fieldEquals("ERC1155TokenBalance", tokenBalanceId, "token", tokenAddress.concatI32(tokenId.toI32()).toHexString())
      assert.fieldEquals("ERC1155TokenBalance", tokenBalanceId, "amount", amount.toString())
      assert.fieldEquals("ERC1155TokenBalance", tokenBalanceId, "burnt", "0")
    })

    test("creates ERC1155Transfer entity with correct data", () => {
      const transferId = transferSingleEvent.transaction.hash.concatI32(0).toHexString()

      assert.fieldEquals("ERC1155Transfer", transferId, "token", tokenAddress.concatI32(tokenId.toI32()).toHexString())
      assert.fieldEquals("ERC1155Transfer", transferId, "from", zeroAddress.toHexString())
      assert.fieldEquals("ERC1155Transfer", transferId, "to", user1Address.toHexString())
      assert.fieldEquals("ERC1155Transfer", transferId, "amount", amount.toString())
      assert.fieldEquals("ERC1155Transfer", transferId, "transaction", transferSingleEvent.transaction.hash.toHexString())
    })
  })

  describe("Burning", () => {
    beforeEach(() => {
      singleTransfer(zeroAddress, user1Address)
      singleTransfer(user1Address, zeroAddress)
    })

    afterEach(() => {
      clearStore()
    })

    test("creates ERC1155Token entity with correct data", () => {
      const erc155TokenId = tokenAddress.concatI32(tokenId.toI32()).toHexString()

      assert.fieldEquals("ERC1155Token", erc155TokenId, "address", tokenAddress.toHexString())
      assert.fieldEquals("ERC1155Token", erc155TokenId, "tokenId", tokenId.toString())
      assert.fieldEquals("ERC1155Token", erc155TokenId, "totalSupply", "0")
      assert.fieldEquals("ERC1155Token", erc155TokenId, "totalBurnt", amount.toString())
    })

    test("creates ERC1155TokenBalance entity with correct data", () => {
      const tokenBalanceId = tokenAddress.concatI32(tokenId.toI32()).concat(user1Address).toHexString()

      assert.fieldEquals("ERC1155TokenBalance", tokenBalanceId, "owner", user1Address.toHexString())
      assert.fieldEquals("ERC1155TokenBalance", tokenBalanceId, "token", tokenAddress.concatI32(tokenId.toI32()).toHexString())
      assert.fieldEquals("ERC1155TokenBalance", tokenBalanceId, "amount", "0")
      assert.fieldEquals("ERC1155TokenBalance", tokenBalanceId, "burnt", amount.toString())
    })

    test("creates ERC1155Transfer entity with correct data", () => {
      const transferId = transferSingleEvent.transaction.hash.concatI32(0).toHexString()

      assert.fieldEquals("ERC1155Transfer", transferId, "token", tokenAddress.concatI32(tokenId.toI32()).toHexString())
      assert.fieldEquals("ERC1155Transfer", transferId, "from", user1Address.toHexString())
      assert.fieldEquals("ERC1155Transfer", transferId, "to", zeroAddress.toHexString())
      assert.fieldEquals("ERC1155Transfer", transferId, "amount", amount.toString())
      assert.fieldEquals("ERC1155Transfer", transferId, "transaction", transferSingleEvent.transaction.hash.toHexString())
    })
  })

  describe("Between users", () => {
    beforeEach(() => {
      singleTransfer(zeroAddress, user1Address)
      singleTransfer(user1Address, user2Address)
    })

    afterEach(() => {
      clearStore()
    })

    test("updates ERC1155TokenBalance entity for sender and receiver", () => {
      const tokenBalanceIdFrom = tokenAddress.concatI32(tokenId.toI32()).concat(user1Address).toHexString()
      const tokenBalanceIdTo = tokenAddress.concatI32(tokenId.toI32()).concat(user2Address).toHexString()

      assert.fieldEquals("ERC1155TokenBalance", tokenBalanceIdFrom, "amount", "0")
      assert.fieldEquals("ERC1155TokenBalance", tokenBalanceIdTo, "amount", amount.toString())
    })

    test("creates ERC1155Transfer entity with correct data", () => {
      const transferId = transferSingleEvent.transaction.hash.concatI32(0).toHexString()

      assert.fieldEquals("ERC1155Transfer", transferId, "token", tokenAddress.concatI32(tokenId.toI32()).toHexString())
      assert.fieldEquals("ERC1155Transfer", transferId, "from", user1Address.toHexString())
      assert.fieldEquals("ERC1155Transfer", transferId, "to", user2Address.toHexString())
      assert.fieldEquals("ERC1155Transfer", transferId, "amount", amount.toString())
      assert.fieldEquals("ERC1155Transfer", transferId, "transaction", transferSingleEvent.transaction.hash.toHexString())
    })
  })
})

function singleTransfer(from: Address, to: Address): void {
  transferSingleEvent = createTransferSingleEvent(tokenAddress, from, to, tokenId, amount)
  handleTransferSingle(transferSingleEvent)
}

function createTransferSingleEvent(
  token: Address,
  from: Address,
  to: Address,
  tokenId: BigInt,
  value: BigInt
): TransferSingleEvent {
  const event = changetype<TransferSingleEvent>(newMockEvent())

  event.address = token
  event.parameters = new Array()

  // FYI, tomorrow devs
  // even if you don't use all params in the event
  // you still need to include all of them in a
  // right order here.

  event.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(Address.zero()))
  )
  event.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  event.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  event.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(tokenId))
  )
  event.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return event
}

