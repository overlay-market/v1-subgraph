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
    FeeRecipientUpdated as FeeRecipientUpdatedEvent,
    ParamUpdated as ParamUpdatedEvent
} from "../../../generated/OverlayV1Factory/OverlayV1Factory"
import { handleFeeRecipientUpdated, handleMarketDeployed, handleParamUpdated } from "../../mapping"
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

// createParamUpdatedEvent attrs

// because RISK_PARAMS[5] doesn't work without million hoops
const paramNameKey = "capLeverage"
const paramNameValue: u8 = 5
const paramValue = BigInt.fromI32(5)

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

    describe("Param Updated event", () => {
        beforeEach(() => {
            loadFactory(factoryAddress.toString())
            const event = createParamUpdatedEvent(factoryAddress, user, market, paramNameValue, paramValue)
            handleParamUpdated(event)
        })

        afterEach(() => {
            clearStore()
        })

        test("param value is set correctly", () => {
            assert.fieldEquals("Market", market.toHexString(), paramNameKey, paramValue.toString())
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

function createParamUpdatedEvent(
    factory: Address,
    user: Address,
    market: Address,
    name: u8,
    value: BigInt
): ParamUpdatedEvent {
    const event = changetype<ParamUpdatedEvent>(newMockEvent())

    event.address = factory
    event.parameters = new Array()

    event.parameters.push(
        new ethereum.EventParam("user", ethereum.Value.fromAddress(user)),
    )
    event.parameters.push(
        new ethereum.EventParam("market", ethereum.Value.fromAddress(market)),
    )
    // fromI32 was chosen because `name` is uint8, int32 includes values up to uint16
    event.parameters.push(
        new ethereum.EventParam("name", ethereum.Value.fromI32(name)),
    )
    event.parameters.push(
        new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value)),
    )

    return event
}