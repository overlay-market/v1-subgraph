import { Address, BigInt, ethereum, Bytes } from '@graphprotocol/graph-ts'
import { ReferralProgram, ReferralPosition } from '../generated/schema'
import { ReferralList, AllowAffiliate, AddAffiliateOrKOL, SetRewardToken, SetAffiliateComission, SetTraderDiscount, AllowKOL } from '../generated/ReferralList/ReferralList'
import { ZERO_BI, REFERRAL_ADDRESS, BPS_BASE_BI } from './utils/constants'
import { loadAccount, loadTransaction } from './utils'

enum Tier {
    NOT_AFFILIATE,
    AFFILIATE,
    KOL
}

export function handleAllowAffiliate(event: AllowAffiliate): void {
    const newAffiliate = event.params.affiliate
    const referralPosition = loadReferralPosition(event.address, newAffiliate)
    referralPosition.tier = Tier.AFFILIATE
    referralPosition.save()
}

export function handleAllowKOL(event: AllowKOL): void {
    const newAffiliate = event.params.KOL
    const referralPosition = loadReferralPosition(event.address, newAffiliate)
    referralPosition.tier = Tier.KOL
    referralPosition.save()
}

export function handleAddAffiliateOrKOL(event: AddAffiliateOrKOL): void {
    const traderReferralPosition = loadReferralPosition(event.address, event.params.trader)
    traderReferralPosition.affiliatedTo = event.params.affiliate.toHexString();
    traderReferralPosition.save()
}

export function handleSetRewardToken(event: SetRewardToken): void {
    const referralProgram = loadReferralProgram(event, event.address)
    referralProgram.rewardToken = event.params.rewardToken
    let transaction = loadTransaction(event)
    transaction.save()

    referralProgram.latestUpdateTransaction = transaction.id;
    referralProgram.save()
}

export function handleSetAffiliateComission(event: SetAffiliateComission): void {
    const referralProgram = loadReferralProgram(event, event.address)
    const tier = event.params.tier
    referralProgram.affiliateComission[tier] = event.params.affiliateComission
    let transaction = loadTransaction(event)
    transaction.save()

    referralProgram.latestUpdateTransaction = transaction.id;
    referralProgram.save()
}

export function handleSetTraderDiscount(event: SetTraderDiscount): void {
    const referralProgram = loadReferralProgram(event, event.address)
    const tier = event.params.tier
    referralProgram.traderDiscount[tier] = event.params.traderDiscount
    let transaction = loadTransaction(event)
    transaction.save()

    referralProgram.latestUpdateTransaction = transaction.id;
    referralProgram.save()
}

export function updateReferralRewards(event: ethereum.Event, owner: Address, transferFeeAmount: BigInt): void {
    const ownerReferralPosition = loadReferralPosition(Address.fromString(REFERRAL_ADDRESS), owner)
    const affiliatedTo = ownerReferralPosition.affiliatedTo

    if (affiliatedTo) {
        const referralProgram = loadReferralProgram(event, Address.fromString(REFERRAL_ADDRESS))
        const affiliateReferralPosition = loadReferralPosition(Address.fromString(REFERRAL_ADDRESS), Address.fromString(affiliatedTo))
        const tier = affiliateReferralPosition.tier

        const traderDiscount = transferFeeAmount.times(referralProgram.traderDiscount[tier]).div(BPS_BASE_BI)
        ownerReferralPosition.totalTraderDiscount = ownerReferralPosition.totalTraderDiscount.plus(traderDiscount)
        ownerReferralPosition.totalRewardsPending = ownerReferralPosition.totalRewardsPending.plus(traderDiscount)

        const affiliateComission = transferFeeAmount.times(referralProgram.affiliateComission[tier]).div(BPS_BASE_BI)
        affiliateReferralPosition.totalAffiliateComission = affiliateReferralPosition.totalAffiliateComission.plus(affiliateComission)
        affiliateReferralPosition.totalRewardsPending = affiliateReferralPosition.totalRewardsPending.plus(affiliateComission)

        referralProgram.totalRewards = referralProgram.totalRewards.plus(traderDiscount).plus(affiliateComission)

        ownerReferralPosition.save()
        affiliateReferralPosition.save()
        referralProgram.save()
    }
}

// FIXME: adjust to new airdrop logic via MerkleClaim, once it's implemented.
export function updateAirdrop(event: ethereum.Event, toAddress: Address, amount: BigInt, transferId: Bytes): void {
    const referralProgram = loadReferralProgram(event, Address.fromString(REFERRAL_ADDRESS))
    referralProgram.totalAirdropped = referralProgram.totalAirdropped.plus(amount)
    referralProgram.save()

    const referralPosition = loadReferralPosition(Address.fromString(REFERRAL_ADDRESS), toAddress)
    referralPosition.totalAirdroppedAmount = referralPosition.totalAirdroppedAmount.plus(amount)
    referralPosition.totalRewardsPending = referralPosition.totalRewardsPending.minus(amount)
    let airdrops = referralPosition.airdrops
    airdrops.push(transferId)
    referralPosition.airdrops = airdrops
    referralPosition.save()
}

export function loadReferralProgram(event: ethereum.Event, referralAddress: Address): ReferralProgram {
    let referralProgram = ReferralProgram.load(referralAddress)
  
    // create new referralProgram if null
    if (referralProgram === null) {
      referralProgram = new ReferralProgram(referralAddress)
      let referralContract = ReferralList.bind(referralAddress)

      referralProgram.createdAtTimestamp = event.block.timestamp
      referralProgram.createdAtBlockNumber = event.block.number

      referralProgram.rewardToken = referralContract.rewardToken();

      referralProgram.affiliateComission = [ZERO_BI, ZERO_BI, ZERO_BI];
      referralProgram.affiliateComission[Tier.AFFILIATE] = referralContract.tierAffiliateComission(Tier.AFFILIATE);
      referralProgram.affiliateComission[Tier.KOL] = referralContract.tierAffiliateComission(Tier.KOL);
      
      referralProgram.traderDiscount = [ZERO_BI, ZERO_BI, ZERO_BI];
      referralProgram.traderDiscount[Tier.AFFILIATE] = referralContract.tierTraderDiscount(Tier.AFFILIATE);
      referralProgram.traderDiscount[Tier.KOL] = referralContract.tierTraderDiscount(Tier.KOL);

      referralProgram.totalRewards = ZERO_BI;
      referralProgram.totalAirdropped = ZERO_BI;
      let transaction = loadTransaction(event)
      transaction.save()

      referralProgram.latestUpdateTransaction = transaction.id;
    }
  
    return referralProgram
}

export function loadReferralPosition(referralProgram: Address, owner: Address): ReferralPosition {
    const account = loadAccount(owner)
    account.save() // ensure account exists

    let referralPosition = ReferralPosition.load(referralProgram.concat(owner))
    if (referralPosition == null) {
        referralPosition = new ReferralPosition(referralProgram.concat(owner))
        referralPosition.referralProgram = referralProgram
        referralPosition.owner = account.id
        referralPosition.tier = Tier.NOT_AFFILIATE
        referralPosition.totalAffiliateComission = ZERO_BI;
        referralPosition.totalTraderDiscount = ZERO_BI;
        referralPosition.totalAirdroppedAmount = ZERO_BI;
        referralPosition.totalRewardsPending = ZERO_BI;
        referralPosition.airdrops = [];
    }
    return referralPosition
}