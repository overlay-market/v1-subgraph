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
} from "../../../generated/OverlayV1Token/OverlayV1Token"
import { ERC20Token } from "../../../generated/schema"
import { handleTransfer, handleTransferOVL } from "../../erc20"

// Export handlers for coverage report
export { handleTransfer, handleTransferOVL }

const from = Address.fromString("0x0000000000000000000000000000000000000001")
const to = Address.fromString("0x0000000000000000000000000000000000000002")
const value = BigInt.fromI32(234)
const address = Address.fromString("0x0000000000000000000000000000000000000003")

let token: ERC20Token
let transferEvent: TransferEvent

describe("Transfer event", () => {
    beforeEach(() => {
        token = new ERC20Token(address)
        token.totalSupply = BigInt.fromI32(10_000_000)
        token.name = "Test Token"
        token.symbol = "TEST"
        token.save()

        transferEvent = createTransferEvent(address, from, to, value)
        handleTransfer(transferEvent, token)
    })

    afterEach(() => {
        clearStore()
    })

    test("token is loaded correctly", () => {
        assert.entityCount("ERC20Token", 1)

        assert.fieldEquals("ERC20Token", token.id.toHexString(),
            "name",
            "Test Token"
        )
        assert.fieldEquals("ERC20Token", token.id.toHexString(),
            "symbol",
            "TEST"
        )
        assert.fieldEquals("ERC20Token", token.id.toHexString(),
            "totalSupply",
            BigInt.fromI32(10_000_000).toString()
        )
    })

    test("creates TokenTransfer entity", () => {
        assert.entityCount("TokenTransfer", 1)

        const id = transferEvent.transaction.hash.concatI32(transferEvent.logIndex.toI32()).toHexString()

        assert.fieldEquals("TokenTransfer", id,
            "token",
            transferEvent.address.toHexString()
        )
        assert.fieldEquals("TokenTransfer", id,
            "from",
            transferEvent.params.from.toHexString()
        )
        assert.fieldEquals("TokenTransfer", id,
            "to",
            transferEvent.params.to.toHexString()
        )
        assert.fieldEquals("TokenTransfer", id,
            "amount",
            transferEvent.params.value.toString()
        )
        assert.fieldEquals("TokenTransfer", id,
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

    test("creates TokenPosition entities for sender and recipient", () => {
        assert.entityCount("TokenPosition", 2)
        assert.entityCount("Account", 2) // also creates Account entities

        const senderId = transferEvent.address.concat(transferEvent.params.from).toHexString()
        const recipientId = transferEvent.address.concat(transferEvent.params.to).toHexString()

        assert.fieldEquals("TokenPosition", senderId,
            "token",
            transferEvent.address.toHexString()
        )
        assert.fieldEquals("TokenPosition", senderId,
            "owner",
            transferEvent.params.from.toHexString()
        )

        assert.fieldEquals("TokenPosition", recipientId,
            "token",
            transferEvent.address.toHexString()
        )
        assert.fieldEquals("TokenPosition", recipientId,
            "owner",
            transferEvent.params.to.toHexString()
        )
    })

    test("updates sender's TokenPosition correctly", () => {
        const initialBalance = BigInt.fromI32(0)

        assert.fieldEquals(
            "TokenPosition",
            transferEvent.address.concat(transferEvent.params.from).toHexString(),
            "balance",
            initialBalance.minus(value).toString()
        )
    })

    test("updates recipient's TokenPosition correctly", () => {
        const initialBalance = BigInt.fromI32(0)

        assert.fieldEquals(
            "TokenPosition",
            transferEvent.address.concat(transferEvent.params.to).toHexString(),
            "balance",
            initialBalance.plus(value).toString()
        )
    })

    test("minting updates totalSupply correctly", () => {
        const recipient = Address.fromString("0x0000000000000000000000000000000000000011")

        const mintEvent = createTransferEvent(
            Address.fromBytes(token.id),
            Address.zero(),
            recipient,
            value
        )

        handleTransfer(mintEvent, token)

        // Updates recipient's balance correctly
        assert.fieldEquals(
            "TokenPosition",
            mintEvent.address.concat(mintEvent.params.to).toHexString(),
            "balance",
            value.toString() // initial balance is 0
        )

        const initialSupply = BigInt.fromI32(10_000_000)

        assert.fieldEquals("ERC20Token", token.id.toHexString(),
            "totalSupply",
            initialSupply.plus(value).toString()
        )
    })

    test("burning updates totalSupply correctly", () => {
        const sender = Address.fromString("0x0000000000000000000000000000000000000011")

        const burnEvent = createTransferEvent(
            Address.fromBytes(token.id),
            sender,
            Address.zero(),
            value
        )

        handleTransfer(burnEvent, token)

        // Updates sender's balance correctly
        assert.fieldEquals(
            "TokenPosition",
            burnEvent.address.concat(burnEvent.params.from).toHexString(),
            "balance",
            BigInt.fromI32(0).minus(value).toString()
        )

        const initialSupply = BigInt.fromI32(10_000_000)

        assert.fieldEquals("ERC20Token", token.id.toHexString(),
            "totalSupply",
            initialSupply.minus(value).toString()
        )
    })

    test("OVL handler works", () => {
        clearStore()

        // Mock the call to the OVL contract
        const expectedName = "Overlay Token"
        const expectedSymbol = "OVL"
        createMockedFunction(address, "name", "name():(string)")
            .returns([ethereum.Value.fromString(expectedName)])
        createMockedFunction(address, "symbol", "symbol():(string)")
            .returns([ethereum.Value.fromString(expectedSymbol)])


        const initialMintEvent = createTransferEvent(
            address,
            Address.zero(),
            to,
            value
        )
        handleTransferOVL(initialMintEvent)

        assert.entityCount("ERC20Token", 1)

        const id = initialMintEvent.address.toHexString()

        assert.fieldEquals("ERC20Token", id,
            "name",
            expectedName
        )
        assert.fieldEquals("ERC20Token", id,
            "symbol",
            expectedSymbol
        )

        assert.entityCount("TokenTransfer", 1)
        assert.entityCount("TokenPosition", 1)
        assert.entityCount("Account", 1)
        assert.entityCount("Transaction", 1)
    })
})

function createTransferEvent(
    token: Address,
    from: Address,
    to: Address,
    value: BigInt
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
        new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
    )

    return event
}
