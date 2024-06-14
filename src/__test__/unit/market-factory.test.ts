import {
    assert,
    describe,
    test,
    clearStore,
    beforeAll,
    beforeEach,
    afterEach
} from "matchstick-as/assembly/index"
import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"

import {
    MarketDeployed as MarketDeployedEvent,
    FeeRecipientUpdated as FeeRecipientUpdatedEvent
} from "../../../generated/OverlayV1Factory/OverlayV1Factory"
import { handleFeeRecipientUpdated, handleMarketDeployed } from "../../mapping"
import { FACTORY_ADDRESS, PERIPHERY_ADDRESS } from "../../utils/constants"
import { setupMarketMockedFunctions } from "./shared/mockedFunctions"
import { loadFactory } from "../../utils"

export { handleMarketDeployed }

const market = Address.fromString("0x0000000000000000000000000000000000000001")
const user = Address.fromString("0x0000000000000000000000000000000000000004");
const feed = Address.fromString("0x0000000000000000000000000000000000000005");
const recipientAddress = Address.fromString("0x0000000000000000000000000000000000000006");

const factoryAddress = Address.fromString(FACTORY_ADDRESS)
const marketStateAddress = Address.fromString(PERIPHERY_ADDRESS)

describe("Market Factory events", () => {
    beforeAll(() => {
        setupMarketMockedFunctions(factoryAddress, marketStateAddress, market)
    })
    describe("Market Deployed event", () => {
        beforeEach(() => {
            const event = createMarketDeployedEvent(factoryAddress, user, market, feed)
            handleMarketDeployed(event)
        })

        afterEach(() => {
            clearStore()
        })

        test("creates Market entity", () => {
            assert.entityCount("Market", 1)
        })

    })

    describe("Fee Recipient Updated event", () => {
        beforeEach(() => {
            // initializing factory
            loadFactory(factoryAddress.toString())
            // imitating an event
            const event = createFeeRecipientUpdatedEvent(factoryAddress, user, recipientAddress)
            handleFeeRecipientUpdated(event)
        })

        afterEach(() => {
            clearStore()
        })

        test("doesn't create additional Factory entity", () => {
            assert.entityCount("Factory", 1)
        })

        test("fee recipient is set correctly", () => {
            assert.fieldEquals("Factory", factoryAddress.toHexString(), "feeRecipient", recipientAddress.toHexString())
        })
    })
})

function createMarketDeployedEvent(
    factory: Address,
    user: Address,
    market: Address,
    feed: Address
): MarketDeployedEvent {
    const event = changetype<MarketDeployedEvent>(newMockEvent())

    event.address = factory
    event.parameters = new Array()

    event.parameters.push(
        new ethereum.EventParam("user", ethereum.Value.fromAddress(user)),
    )
    event.parameters.push(
        new ethereum.EventParam("market", ethereum.Value.fromAddress(market)),
    )
    event.parameters.push(
        new ethereum.EventParam("feed", ethereum.Value.fromAddress(feed)),
    )

    return event
}

function createFeeRecipientUpdatedEvent(
    factory: Address,
    user: Address,
    recipient: Address
): FeeRecipientUpdatedEvent {
    const event = changetype<FeeRecipientUpdatedEvent>(newMockEvent())

    event.address = factory
    event.parameters = new Array()

    event.parameters.push(
        new ethereum.EventParam("user", ethereum.Value.fromAddress(user)),
    )
    event.parameters.push(
        new ethereum.EventParam("recipient", ethereum.Value.fromAddress(recipient)),
    )

    return event
}