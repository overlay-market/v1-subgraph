import {
    assert,
    describe,
    test,
    clearStore,
    beforeEach,
    afterEach,
    createMockedFunction
} from "matchstick-as/assembly/index"
import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"

import {
    Transfer as TransferEvent,
} from "../../../generated/PlanckCat/PlanckCat"
import { handleTransfer } from "../../planck-cat"

const from = Address.fromString("0x0000000000000000000000000000000000000001")
const to = Address.fromString("0x0000000000000000000000000000000000000002")
const tokenId = BigInt.fromI32(234)
const tokenUri = "https://planck.cat/234"
const address = Address.fromString("0x0000000000000000000000000000000000000003")
const name = "PlanckCat"
const symbol = "PCAT"

let transferEvent: TransferEvent

describe("Transfer event", () => {
    beforeEach(() => {
        transferEvent = createTransferEvent(address, from, to, tokenId)

        createMockedFunction(address, "name", "name():(string)")
            .returns([ethereum.Value.fromString(name)])

        createMockedFunction(address, "symbol", "symbol():(string)")
            .returns([ethereum.Value.fromString(symbol)])
        
        createMockedFunction(address, "tokenURI", "tokenURI(uint256):(string)")
            .withArgs([ethereum.Value.fromUnsignedBigInt(tokenId)])
            .returns([ethereum.Value.fromString(tokenUri)])

        handleTransfer(transferEvent)
    })

    afterEach(() => {
        clearStore()
    })

    test("creates ERC721Transfer entity", () => {
        assert.entityCount("ERC721Transfer", 10)

        const id = transferEvent.transaction.hash.concatI32(transferEvent.logIndex.toI32()).toHexString()

        assert.fieldEquals("ERC721Transfer", id,
            "nft",
            address.concatI32(tokenId.toI32()).toHexString()
        )
        assert.fieldEquals("ERC721Transfer", id,
            "from",
            from.toHexString()
        )
        assert.fieldEquals("ERC721Transfer", id,
            "to",
            to.toHexString()
        )
        assert.fieldEquals("ERC721Transfer", id,
            "transaction",
            transferEvent.transaction.hash.toHexString()
        )
    })

    test("creates Transaction entity", () => {
        assert.entityCount("Transaction", 1)

        const id = transferEvent.transaction.hash.toHexString()

        assert.fieldEquals("Transaction", id,
            "blockNumber",
            transferEvent.block.number.toString()
        )
        assert.fieldEquals("Transaction", id,
            "timestamp",
            transferEvent.block.timestamp.toString()
        )
        assert.fieldEquals("Transaction", id,
            "gasLimit",
            transferEvent.transaction.gasLimit.toString()
        )
        assert.fieldEquals("Transaction", id,
            "gasPrice",
            transferEvent.transaction.gasPrice.toString()
        )
    })

    test("creates ERC721NFT entity", () => {
        assert.entityCount("ERC721NFT", 1)

        const id = address.concatI32(tokenId.toI32()).toHexString()

        assert.fieldEquals("ERC721NFT", id,
            "contract",
            address.toHexString()
        )
        assert.fieldEquals("ERC721NFT", id,
            "tokenId",
            tokenId.toString()
        )
        assert.fieldEquals("ERC721NFT", id,
            "tokenUri",
            tokenUri
        )
        assert.fieldEquals("ERC721NFT", id,
            "owner",
            to.toHexString()
        )
    })

    test("updates account's balances correctly", () => {
        assert.entityCount("Account", 2)

        // Both accounts should have an initial balance of 0 for the tests
        assert.fieldEquals("Account", from.toHexString(),
            "planckCatBalance",
            "-1"
        )
        assert.fieldEquals("Account", to.toHexString(),
            "planckCatBalance",
            "1"
        )
    })

    test("minting updates total supply", () => {
        transferEvent = createTransferEvent(address, Address.zero(), to, tokenId)
        handleTransfer(transferEvent)

        assert.entityCount("ERC721Token", 1)

        assert.fieldEquals("ERC721Token", address.toHexString(),
            "totalSupply",
            "1"
        )

        assert.fieldEquals("Account", to.toHexString(),
            "planckCatBalance",
            "2" // 1 from before each test + 1 from this test
        )
    })

    test("burning updates total supply", () => {
        transferEvent = createTransferEvent(address, from, Address.zero(), tokenId)
        handleTransfer(transferEvent)

        assert.entityCount("ERC721Token", 1)

        assert.fieldEquals("ERC721Token", address.toHexString(),
            "totalSupply",
            "-1"
        )

        assert.fieldEquals("Account", from.toHexString(),
            "planckCatBalance",
            "-2" // -1 from before each test - 1 from this test
        )
    })
})

function createTransferEvent(
    token: Address,
    from: Address,
    to: Address,
    tokenId: BigInt
): TransferEvent {
    const event = changetype<TransferEvent>(newMockEvent())
  
    event.address = token
    event.parameters = new Array()
  
    event.parameters.push(
      new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
    )
    event.parameters.push(
      new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
    )
    event.parameters.push(
      new ethereum.EventParam("tokenId", ethereum.Value.fromUnsignedBigInt(tokenId))
    )
  
    return event
}
