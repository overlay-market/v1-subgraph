import {
    assert,
    describe,
    test,
    clearStore,
    beforeAll,
    beforeEach,
    afterEach,
    createMockedFunction
} from "matchstick-as/assembly/index"
import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"

import {
    Build as BuildEvent,
    CacheRiskCalc as CacheRiskCalcEvent,
    Update as UpdateEvent,
} from "../../../generated/templates/OverlayV1Market/OverlayV1Market"
import { handleBuild, handleCacheRiskCalc, handleUpdate } from "../../mapping"
import { loadAccount } from "../../utils"
import { loadTradingMining } from "../../trading-mining"
import { loadReferralProgram, loadReferralPosition } from "../../referral"
import { PERIPHERY_ADDRESS, TRADING_MINING_ADDRESS, REFERRAL_ADDRESS, ADDRESS_ZERO } from "../../utils/constants"
import { setupMarketMockedFunctions, setupTradingMiningMockedFunctions } from "./shared/mockedFunctions"
import { MARKET_COLLATERAL, MARKET_PCD_HOLDER, MARKET_POSITION_ID, MARKET_SENDER } from "./shared/constants"

// Export handlers for coverage report
export { handleBuild, handleCacheRiskCalc, handleUpdate }

const market = Address.fromString("0x0000000000000000000000000000000000000001")
const tmAddress = Address.fromString(TRADING_MINING_ADDRESS)
const referralAddress = Address.fromString(REFERRAL_ADDRESS)
const marketStateAddress = Address.fromString(PERIPHERY_ADDRESS)
const zeroAddress = Address.fromString(ADDRESS_ZERO)

// Build event parameters
const sender = MARKET_SENDER
const pcdHolder = MARKET_PCD_HOLDER
const positionId = MARKET_POSITION_ID
const collateral = MARKET_COLLATERAL

const oi = BigInt.fromI32(50)
const debt = BigInt.fromI32(20)
const isLong = true
const price = BigInt.fromI32(100)
const oiAfterBuild = BigInt.fromI32(51)
const oiSharesAfterBuild = BigInt.fromI32(1)

// CacheRiskCalc event parameters
const dpUpperLimit = BigInt.fromI32(100)

// Update event parameters
const oiLong = BigInt.fromI32(50)
const oiShort = BigInt.fromI32(50)

// Trading mining parameters
const epoch = 0

// Referral parameters
const rewardToken = Address.fromString("0x0000000000000000000000000000000000000003")
const affiliateComission = BigInt.fromI32(300) // 3%
const kolComission = BigInt.fromI32(700) // 7%
const affiliateDiscount = BigInt.fromI32(300) // 2%
const kolDiscount = BigInt.fromI32(700) // 5%

describe("Market events", () => {

    // Mock contract calls with dummy values
    beforeAll(() => {
        setupMarketMockedFunctions(zeroAddress, marketStateAddress, market)
        setupTradingMiningMockedFunctions(tmAddress, epoch)
    })
    describe("Build event", () => {

        beforeEach(() => {
            const event = createBuildEvent(market, sender, positionId, oi, debt, isLong, price, oiAfterBuild, oiSharesAfterBuild)
            handleBuild(event)
        })

        afterEach(() => {
            clearStore()
        })

        test("creates Market entity", () => {
            assert.entityCount("Market", 1)
        })

        describe("Trading Mining", () => {

            test("creates TradingMiningEpochVolume entity", () => {
                assert.entityCount("TradingMiningEpochVolume", 1)
            })

            test("updates trader's epoch volume", () => {
                assert.fieldEquals("TradingMiningEpochVolume", tmAddress.concat(sender).concatI32(epoch).toHexString(),
                    "volume",
                    collateral.plus(debt).toString()
                )
            })

            test("bonus for PCD holders", () => {
                const bonus = 10

                // Create PCD holder account
                const account = loadAccount(pcdHolder)
                account.planckCatBalance = BigInt.fromI32(1)
                account.save()

                // Set bonus percentage in TradingMining entity
                const tradingMining = loadTradingMining(tmAddress)
                tradingMining.pcdHolderBonusPercentage = bonus
                tradingMining.save()

                // Create Build event with PCD holder as sender
                const event = createBuildEvent(market, pcdHolder, positionId, oi, debt, isLong, price, oiAfterBuild, oiSharesAfterBuild)
                handleBuild(event)

                const volume = collateral.plus(debt)

                assert.fieldEquals("TradingMiningEpochVolume", tmAddress.concat(pcdHolder).concatI32(epoch).toHexString(),
                    "volume",
                    volume.plus(volume.times(BigInt.fromI32(bonus)).div(BigInt.fromI32(100))).toString()
                )

                assert.fieldEquals("Account", pcdHolder.toHexString(),
                    "ovlVolumeTraded",
                    volume.toString()
                )
            })

        })

        describe("Referral", () => {

            beforeAll(() => {
                createMockedFunction(referralAddress, "rewardToken", "rewardToken():(address)")
                    .returns([ethereum.Value.fromAddress(rewardToken)])

                createMockedFunction(referralAddress, "tierAffiliateComission", "tierAffiliateComission(uint8):(uint48)")
                    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1))])
                    .returns([ethereum.Value.fromUnsignedBigInt(affiliateComission)])
                createMockedFunction(referralAddress, "tierAffiliateComission", "tierAffiliateComission(uint8):(uint48)")
                    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(2))])
                    .returns([ethereum.Value.fromUnsignedBigInt(kolComission)])

                createMockedFunction(referralAddress, "tierTraderDiscount", "tierTraderDiscount(uint8):(uint48)")
                    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1))])
                    .returns([ethereum.Value.fromUnsignedBigInt(affiliateDiscount)])
                createMockedFunction(referralAddress, "tierTraderDiscount", "tierTraderDiscount(uint8):(uint48)")
                    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(2))])
                    .returns([ethereum.Value.fromUnsignedBigInt(kolDiscount)])
            })

            beforeEach(() => {
                const referralProgram = loadReferralProgram(newMockEvent(), referralAddress)
                referralProgram.affiliateComission = [BigInt.fromI32(0), affiliateComission, kolComission]
                referralProgram.traderDiscount = [BigInt.fromI32(0), affiliateDiscount, kolDiscount]
                referralProgram.save()

                const affiliate = Address.fromString("0x0000000000000000000000000000000000000123")

                const ownerReferralPosition = loadReferralPosition(referralAddress, sender)
                ownerReferralPosition.affiliatedTo = affiliate.toHexString();
                ownerReferralPosition.save()

                const affiliateReferralPosition = loadReferralPosition(referralAddress, affiliate)
                affiliateReferralPosition.tier = 1 // affiliate
                affiliateReferralPosition.save()

                const event = createBuildEvent(market, sender, positionId, oi, debt, isLong, price, oiAfterBuild, oiSharesAfterBuild)
                handleBuild(event)
            })

            // FIXME: transferFeeAmount is always 0 during build event
            test("updates owner referral position", () => {
                const id = referralAddress.concat(sender).toHexString()

                assert.fieldEquals("ReferralPosition", id,
                    "totalTraderDiscount",
                    BigInt.fromI32(0).toString()
                )

                assert.fieldEquals("ReferralPosition", id,
                    "totalRewardsPending",
                    BigInt.fromI32(0).toString()
                )
            })

            // FIXME: transferFeeAmount is always 0 during build event
            test("updates affiliate referral position", () => {
                const affiliate = Address.fromString("0x0000000000000000000000000000000000000123")
                const id = referralAddress.concat(affiliate).toHexString()

                assert.fieldEquals("ReferralPosition", id,
                    "totalAffiliateComission",
                    BigInt.fromI32(0).toString()
                )

                assert.fieldEquals("ReferralPosition", id,
                    "totalRewardsPending",
                    BigInt.fromI32(0).toString()
                )
            })

        })

    })

    describe("CacheRiskCalc event", () => {
        beforeEach(() => {
            const event = createCacheRiskCalcEvent(market, dpUpperLimit)
            handleCacheRiskCalc(event)
        })

        afterEach(() => {
            clearStore()
        })

        test("updates Market entity", () => {
            assert.fieldEquals("Market", market.toHexString(),
                "dpUpperLimit",
                dpUpperLimit.toString()
            )
        })
    })

    describe("Update event", () => {
        beforeEach(() => {
            const event = createUpdateEvent(market, oiLong, oiShort)
            handleUpdate(event)
        })

        afterEach(() => {
            clearStore()
        })

        test("updates Market entity", () => {
            assert.fieldEquals("Market", market.toHexString(),
                "oiLong",
                oiLong.toString()
            )

            assert.fieldEquals("Market", market.toHexString(),
                "oiShort",
                oiShort.toString()
            )
        })
    })
})

function createBuildEvent(
    market: Address,
    sender: Address,
    positionId: BigInt,
    oi: BigInt,
    debt: BigInt,
    isLong: boolean,
    price: BigInt,
    oiAfterBuild: BigInt,
    oiSharesAfterBuild: BigInt
): BuildEvent {
    const event = changetype<BuildEvent>(newMockEvent())

    event.address = market
    event.parameters = new Array()

    event.parameters.push(
        new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
    )

    event.parameters.push(
        new ethereum.EventParam("positionId", ethereum.Value.fromUnsignedBigInt(positionId))
    )

    event.parameters.push(
        new ethereum.EventParam("oi", ethereum.Value.fromUnsignedBigInt(oi))
    )

    event.parameters.push(
        new ethereum.EventParam("debt", ethereum.Value.fromUnsignedBigInt(debt))
    )

    event.parameters.push(
        new ethereum.EventParam("isLong", ethereum.Value.fromBoolean(isLong))
    )

    event.parameters.push(
        new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
    )

    event.parameters.push(
        new ethereum.EventParam("oiAfterBuild", ethereum.Value.fromUnsignedBigInt(oiAfterBuild))
    )

    event.parameters.push(
        new ethereum.EventParam("oiSharesAfterBuild", ethereum.Value.fromUnsignedBigInt(oiSharesAfterBuild))
    )

    return event
}

function createCacheRiskCalcEvent(
    market: Address,
    dpUpperLimit: BigInt
): CacheRiskCalcEvent {
    const event = changetype<CacheRiskCalcEvent>(newMockEvent())

    event.address = market
    event.parameters = new Array()

    event.parameters.push(
        new ethereum.EventParam("dpUpperLimit", ethereum.Value.fromUnsignedBigInt(dpUpperLimit))
    )

    return event
}

function createUpdateEvent(
    market: Address,
    oiLong: BigInt,
    oiShort: BigInt
): UpdateEvent {
    const event = changetype<UpdateEvent>(newMockEvent())

    event.address = market
    event.parameters = new Array()

    event.parameters.push(
        new ethereum.EventParam("oiLong", ethereum.Value.fromUnsignedBigInt(oiLong))
    )

    event.parameters.push(
        new ethereum.EventParam("oiShort", ethereum.Value.fromUnsignedBigInt(oiShort))
    )

    return event
}
