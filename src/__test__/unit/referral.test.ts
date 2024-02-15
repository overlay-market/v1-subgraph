import {
    assert,
    describe,
    test,
    clearStore,
    beforeAll,
    beforeEach,
    afterEach,
    createMockedFunction,
} from "matchstick-as/assembly/index"
import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"

import {
    ClaimRewards as ClaimRewardsEvent,
    SetTraderDiscount as SetTraderDiscountEvent,
    SetAffiliateComission as SetAffiliateComissionEvent,
} from '../../../generated/ReferralList/ReferralList'
import {
    handleClaimRewards,
    handleSetTraderDiscount,
    handleSetAffiliateComission,
    Tier,
} from "../../referral"

// Export handlers for coverage report
export {
    handleClaimRewards,
}

const referralList = Address.fromString("0x0000000000000000000000000000000000000001")
const alice = Address.fromString("0x0000000000000000000000000000000000000002")
const rewardToken = Address.fromString("0x0000000000000000000000000000000000000003")
const amount = BigInt.fromI32(100)
const affiliateComission = BigInt.fromI32(300) // 3%
const kolComission = BigInt.fromI32(700) // 7%
const affiliateDiscount = BigInt.fromI32(200) // 2%
const kolDiscount = BigInt.fromI32(500) // 5%

describe("Referral contract events", () => {

    beforeAll(() => {
        createMockedFunction(referralList, "rewardToken", "rewardToken():(address)")
            .returns([ethereum.Value.fromAddress(rewardToken)])

        createMockedFunction(referralList, "tierAffiliateComission", "tierAffiliateComission(uint8):(uint48)")
            .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1))])
            .returns([ethereum.Value.fromUnsignedBigInt(affiliateComission)])
        createMockedFunction(referralList, "tierAffiliateComission", "tierAffiliateComission(uint8):(uint48)")
            .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(2))])
            .returns([ethereum.Value.fromUnsignedBigInt(kolComission)])
        
        createMockedFunction(referralList, "tierTraderDiscount", "tierTraderDiscount(uint8):(uint48)")
            .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1))])
            .returns([ethereum.Value.fromUnsignedBigInt(affiliateDiscount)])
        createMockedFunction(referralList, "tierTraderDiscount", "tierTraderDiscount(uint8):(uint48)")
            .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(2))])
            .returns([ethereum.Value.fromUnsignedBigInt(kolDiscount)])
    })

    describe("ClaimRewards event", () => {

        beforeEach(() => {
            const event = createClaimRewardsEvent(referralList, alice, amount)
            handleClaimRewards(event)
        })

        afterEach(() => {
            clearStore()
        })

        test("updates ReferralProgram entity", () => {
            assert.entityCount("ReferralProgram", 1)

            assert.fieldEquals("ReferralProgram", referralList.toHexString(),
                "totalAirdropped",
                amount.toString()
            )
        })

        test("updates ReferralPosition entity", () => {
            assert.entityCount("ReferralPosition", 1)
            const id = referralList.concat(alice).toHexString()

            assert.fieldEquals("ReferralPosition", id,
                "totalAirdroppedAmount",
                amount.toString()
            )

            assert.fieldEquals("ReferralPosition", id,
                "totalRewardsPending",
                // referral position does not have rewards pending by default
                BigInt.fromI32(0).minus(amount).toString()
            )
        })

    })

    describe("SetTraderDiscount event", () => {

        beforeEach(() => {
            const event = createSetTraderDiscountEvent(referralList, Tier.AFFILIATE, affiliateDiscount)
            handleSetTraderDiscount(event)
        })

        afterEach(() => {
            clearStore()
        })

        test("updates ReferralProgram entity", () => {
            assert.entityCount("ReferralProgram", 1)

            assert.fieldEquals("ReferralProgram", referralList.toHexString(),
                "traderDiscount",
                `[${BigInt.fromI32(0)}, ${affiliateDiscount}, ${BigInt.fromI32(0)}]`
            )
        })

    })

    describe("SetTraderDiscount event", () => {

        beforeEach(() => {
            const event = createSetAffiliateComissionEvent(referralList, Tier.AFFILIATE, affiliateComission)
            handleSetAffiliateComission(event)
        })

        afterEach(() => {
            clearStore()
        })

        test("updates ReferralProgram entity", () => {
            assert.entityCount("ReferralProgram", 1)

            assert.fieldEquals("ReferralProgram", referralList.toHexString(),
                "affiliateComission",
                `[${BigInt.fromI32(0)}, ${affiliateComission}, ${BigInt.fromI32(0)}]`
            )
        })

    })

})

function createClaimRewardsEvent(
    referralList: Address,
    to: Address,
    amount: BigInt
): ClaimRewardsEvent {
    const event = changetype<ClaimRewardsEvent>(newMockEvent())
  
    event.address = referralList
    event.parameters = new Array()
  
    event.parameters.push(
        new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
    )
    event.parameters.push(
        new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
    )
  
    return event
}

function createSetTraderDiscountEvent(
    referralList: Address,
    tier: Tier,
    traderDiscount: BigInt
): SetTraderDiscountEvent {
    const event = changetype<SetTraderDiscountEvent>(newMockEvent())
  
    event.address = referralList
    event.parameters = new Array()
  
    event.parameters.push(
        new ethereum.EventParam("tier", ethereum.Value.fromI32(tier))
    )
    event.parameters.push(
        new ethereum.EventParam("traderDiscount", ethereum.Value.fromUnsignedBigInt(traderDiscount))
    )
  
    return event
}

function createSetAffiliateComissionEvent(
    referralList: Address,
    tier: Tier,
    comission: BigInt
): SetAffiliateComissionEvent {
    const event = changetype<SetAffiliateComissionEvent>(newMockEvent())
  
    event.address = referralList
    event.parameters = new Array()
  
    event.parameters.push(
        new ethereum.EventParam("tier", ethereum.Value.fromI32(tier))
    )
    event.parameters.push(
        new ethereum.EventParam("affiliateComission", ethereum.Value.fromUnsignedBigInt(comission))
    )
  
    return event
}
