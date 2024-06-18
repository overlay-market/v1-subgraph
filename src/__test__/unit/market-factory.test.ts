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
} from "../../../generated/OverlayV1Factory/OverlayV1Factory"
import { handleFeeRecipientUpdated, handleMarketDeployed } from "../../mapping"
import { FACTORY_ADDRESS, PERIPHERY_ADDRESS } from "../../utils/constants"
import { setupMarketMockedFunctions } from "./shared/mockedFunctions"

export { handleMarketDeployed }

const market = Address.fromString("0x0000000000000000000000000000000000000001")
const user = Address.fromString("0x0000000000000000000000000000000000000004");
const feed = Address.fromString("0x0000000000000000000000000000000000000005");

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