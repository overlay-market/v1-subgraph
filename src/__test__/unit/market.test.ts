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
import { PERIPHERY_ADDRESS, TRADING_MINING_ADDRESS, REFERRAL_ADDRESS } from "../../utils/constants"

// Export handlers for coverage report
export { handleBuild }

const market = Address.fromString("0x0000000000000000000000000000000000000001")
const tmAddress = Address.fromString(TRADING_MINING_ADDRESS)
const referralAddress = Address.fromString(REFERRAL_ADDRESS)
const marketStateAddress = Address.fromString(PERIPHERY_ADDRESS)

// Build event parameters
const sender = Address.fromString("0x0000000000000000000000000000000000000b0b")
const pcdHolder = Address.fromString("0x000000000000000000000000000000000000ca1e")
const positionId = BigInt.fromI32(1)
const oi = BigInt.fromI32(50)
const debt = BigInt.fromI32(20)
const isLong = true
const price = BigInt.fromI32(100)
const collateral = BigInt.fromI32(1000)
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
        // Market contract
        createMockedFunction(market, "feed", "feed():(address)")
            .returns([ethereum.Value.fromAddress(Address.zero())])
        createMockedFunction(market, "factory", "factory():(address)")
            .returns([ethereum.Value.fromAddress(Address.zero())])
        for (let i = 0; i < 15; i++) {
            createMockedFunction(market, "params", "params(uint256):(uint256)")
                .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(i))])
                .returns([ethereum.Value.fromI32(1)])
        }
        createMockedFunction(market, "dpUpperLimit", "dpUpperLimit():(uint256)")
            .returns([ethereum.Value.fromI32(1)])

        // Periphery contract
        createMockedFunction(Address.fromString(PERIPHERY_ADDRESS), "ois", "ois(address):(uint256,uint256)")
            .withArgs([ethereum.Value.fromAddress(market)])
            .returns([ethereum.Value.fromI32(1), ethereum.Value.fromI32(1)])
        createMockedFunction(Address.fromString(PERIPHERY_ADDRESS), "cost", "cost(address,address,uint256):(uint256)")
            .withArgs([ethereum.Value.fromAddress(market), ethereum.Value.fromAddress(sender), ethereum.Value.fromUnsignedBigInt(positionId)])
            .returns([ethereum.Value.fromUnsignedBigInt(collateral)])
        createMockedFunction(Address.fromString(PERIPHERY_ADDRESS), "value", "value(address,address,uint256):(uint256)")
            .withArgs([ethereum.Value.fromAddress(market), ethereum.Value.fromAddress(sender), ethereum.Value.fromUnsignedBigInt(positionId)])
            .returns([ethereum.Value.fromI32(1)])
        createMockedFunction(Address.fromString(PERIPHERY_ADDRESS), "cost", "cost(address,address,uint256):(uint256)")
            .withArgs([ethereum.Value.fromAddress(market), ethereum.Value.fromAddress(pcdHolder), ethereum.Value.fromUnsignedBigInt(positionId)])
            .returns([ethereum.Value.fromUnsignedBigInt(collateral)])
        createMockedFunction(Address.fromString(PERIPHERY_ADDRESS), "value", "value(address,address,uint256):(uint256)")
            .withArgs([ethereum.Value.fromAddress(market), ethereum.Value.fromAddress(pcdHolder), ethereum.Value.fromUnsignedBigInt(positionId)])
            .returns([ethereum.Value.fromI32(1)])

        // TradingMining contract
        createMockedFunction(tmAddress, "getCurrentEpoch", "getCurrentEpoch():(uint256)")
            .returns([ethereum.Value.fromI32(epoch)])
        createMockedFunction(tmAddress, "rewardToken1", "rewardToken1():(address)")
            .returns([ethereum.Value.fromAddress(Address.zero())])
        createMockedFunction(tmAddress, "rewardToken2", "rewardToken2():(address)")
            .returns([ethereum.Value.fromAddress(Address.zero())])
        createMockedFunction(tmAddress, "token1Percentage", "token1Percentage():(uint8)")
            .returns([ethereum.Value.fromI32(0)])
        createMockedFunction(tmAddress, "startTime", "startTime():(uint64)")
            .returns([ethereum.Value.fromI32(0)])
        createMockedFunction(tmAddress, "epochDuration", "epochDuration():(uint64)")
            .returns([ethereum.Value.fromI32(0)])
        createMockedFunction(tmAddress, "pcdHolderBonusPercentage", "pcdHolderBonusPercentage():(uint8)")
            .returns([ethereum.Value.fromI32(0)])
        createMockedFunction(tmAddress, "totalRewards", "totalRewards():(uint256)")
            .returns([ethereum.Value.fromI32(0)])
        createMockedFunction(tmAddress, "maxRewardPerEpochPerAddress", "maxRewardPerEpochPerAddress():(uint256)")
            .returns([ethereum.Value.fromI32(0)])

        // Market state contract
        createMockedFunction(marketStateAddress, "marketState", "marketState(address):((uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,int256))")
            .withArgs([ethereum.Value.fromAddress(market)])
            .returns([ethereum.Value.fromTuple(changetype<ethereum.Tuple>([
                ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
                ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)),
                ethereum.Value.fromSignedBigInt(BigInt.fromI32(1))
            ]))])
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
