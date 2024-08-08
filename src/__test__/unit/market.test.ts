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
    Liquidate as LiquidateEvent,
    Unwind as UnwindEvent,
    EmergencyWithdraw as EmergencyWithdrawEvent,
} from "../../../generated/templates/OverlayV1Market/OverlayV1Market"
import { handleBuild, handleLiquidate, handleUnwind, handleEmergencyWithdraw, handleCacheRiskCalc, handleUpdate } from "../../mapping"
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

// Unwind event parameters
const oiAfterUnwind = BigInt.fromI32(25)
const oiSharesAfterUnwind = BigInt.fromI32(1)
const fraction = BigInt.fromI32(5)

// Liquidate event parameters
const oiAfterLiquidate = BigInt.fromI32(0)
const oiSharesAfterLiquidate = BigInt.fromI32(0)

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

        test("creates Build entity with correct attributes", () => {
            const marketId = market.concatI32(positionId.toI32()).toHexString()

            assert.entityCount("Build", 1)
            assert.fieldEquals("Build", marketId, "owner", sender.toHexString())
            assert.fieldEquals("Build", marketId, "currentOi", oi.toString())
            assert.fieldEquals("Build", marketId, "currentDebt", debt.toString())
            assert.fieldEquals("Build", marketId, "isLong", isLong.toString())
            assert.fieldEquals("Build", marketId, "price", price.toString())
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
                ownerReferralPosition.affiliatedTo = affiliate;
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

    describe("Unwind event", () => {
        beforeEach(() => {
            // Create a Build event to set up the initial position
            const buildEvent = createBuildEvent(market, sender, positionId, oi, debt, isLong, price, oi, oiSharesAfterBuild)
            handleBuild(buildEvent)

            // Now create an Unwind event to test
            const unwindEvent = createUnwindEvent(market, sender, positionId, fraction, BigInt.fromI32(10), price, oiAfterUnwind, oiSharesAfterUnwind)
            handleUnwind(unwindEvent)
        })

        afterEach(() => {
            clearStore()
        })

        test("creates Unwind entity with correct attributes", () => {
            const unwindId = market.concatI32(positionId.toI32()).concatI32(0).toHexString()

            assert.entityCount("Unwind", 1)
            assert.fieldEquals("Unwind", unwindId, "owner", sender.toHexString())
            assert.fieldEquals("Unwind", unwindId, "currentOi", oi.toString())
            assert.fieldEquals("Unwind", unwindId, "currentDebt", debt.toString())
            assert.fieldEquals("Unwind", unwindId, "isLong", isLong.toString())
            assert.fieldEquals("Unwind", unwindId, "price", price.toString())
        })
    })

    describe("Liquidate event", () => {
        beforeEach(() => {
            // Create a Build event to set up the initial position
            const buildEvent = createBuildEvent(market, sender, positionId, oi, debt, isLong, price, oi, oiSharesAfterBuild)
            handleBuild(buildEvent)

            // Now create a Liquidate event to test
            const liquidateEvent = createLiquidateEvent(market, zeroAddress, sender, positionId, BigInt.fromI32(10), price, oiAfterLiquidate, oiSharesAfterLiquidate)
            handleLiquidate(liquidateEvent)
        })

        afterEach(() => {
            clearStore()
        })

        test("creates Liquidate entity with correct attributes", () => {
            const liquidateId = market.concatI32(positionId.toI32()).toHexString();

            assert.entityCount("Liquidate", 1)
            assert.fieldEquals("Liquidate", liquidateId, "owner", sender.toHexString())
            assert.fieldEquals("Liquidate", liquidateId, "sender", zeroAddress.toHexString())
            assert.fieldEquals("Liquidate", liquidateId, "currentOi", oi.toString())
            assert.fieldEquals("Liquidate", liquidateId, "currentDebt", debt.toString())
            assert.fieldEquals("Liquidate", liquidateId, "isLong", isLong.toString())
            assert.fieldEquals("Liquidate", liquidateId, "price", price.toString())
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

function createUnwindEvent(
    market: Address,
    sender: Address,
    positionId: BigInt,
    fraction: BigInt,
    mint: BigInt,
    price: BigInt,
    oiAfterUnwind: BigInt,
    oiSharesAfterUnwind: BigInt
): UnwindEvent {
    const event = changetype<UnwindEvent>(newMockEvent())

    event.address = market
    event.parameters = new Array()

    event.parameters.push(new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender)))
    event.parameters.push(new ethereum.EventParam("positionId", ethereum.Value.fromUnsignedBigInt(positionId)))
    event.parameters.push(new ethereum.EventParam("fraction", ethereum.Value.fromUnsignedBigInt(fraction)))
    event.parameters.push(new ethereum.EventParam("mint", ethereum.Value.fromUnsignedBigInt(mint)))
    event.parameters.push(new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price)))
    event.parameters.push(new ethereum.EventParam("oiAfterUnwind", ethereum.Value.fromUnsignedBigInt(oiAfterUnwind)))
    event.parameters.push(new ethereum.EventParam("oiSharesAfterUnwind", ethereum.Value.fromUnsignedBigInt(oiSharesAfterUnwind)))

    return event
}

function createLiquidateEvent(
    market: Address,
    sender: Address,
    owner: Address,
    positionId: BigInt,
    mint: BigInt,
    price: BigInt,
    oiAfterLiquidate: BigInt,
    oiSharesAfterLiquidate: BigInt
): LiquidateEvent {
    const event = changetype<LiquidateEvent>(newMockEvent())

    event.address = market
    event.parameters = new Array()

    event.parameters.push(new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender)))
    event.parameters.push(new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner)))
    event.parameters.push(new ethereum.EventParam("positionId", ethereum.Value.fromUnsignedBigInt(positionId)))
    event.parameters.push(new ethereum.EventParam("mint", ethereum.Value.fromUnsignedBigInt(mint)))
    event.parameters.push(new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price)))
    event.parameters.push(new ethereum.EventParam("oiAfterLiquidate", ethereum.Value.fromUnsignedBigInt(oiAfterLiquidate)))
    event.parameters.push(new ethereum.EventParam("oiSharesAfterLiquidate", ethereum.Value.fromUnsignedBigInt(oiSharesAfterLiquidate)))

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
