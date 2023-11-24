import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { ReferralProgram, ReferralPosition } from '../generated/schema'
import { ReferralList, AllowAffiliates, AddAffiliate, SetRewardToken, SetAffiliateComission } from '../generated/ReferralList/ReferralList'
import { ZERO_BI } from './utils/constants'
import { loadAccount } from './utils'

export function handleAllowAffiliates(event: AllowAffiliates): void {
    const newAffiliates = event.params.affiliates
    for (let i=0; i < newAffiliates.length; i++) {
        const referralPosition = loadReferralPosition(event.address, newAffiliates[i])
        referralPosition.isAffiliate = true
        referralPosition.save()
    }
}

export function handleAddAffiliate(event: AddAffiliate): void {
    const traderReferralPosition = loadReferralPosition(event.address, event.params.trader)
    traderReferralPosition.affiliatedTo = event.params.affiliate.toHexString();
    traderReferralPosition.save()
}

export function handleSetRewardToken(event: SetRewardToken): void {
    const referralProgram = loadReferralProgram(event, event.address)
    referralProgram.rewardToken = event.params.rewardToken
    referralProgram.save()
}

export function handleSetAffiliateComission(event: SetAffiliateComission): void {
    const referralProgram = loadReferralProgram(event, event.address)
    referralProgram.affiliateComission = event.params.affiliateComission
    referralProgram.save()
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
      referralProgram.affiliateComission = referralContract.affiliateComission();
      referralProgram.traderDiscount = referralContract.traderDiscount();
      referralProgram.totalRewards = ZERO_BI;
      referralProgram.totalAirdropped = ZERO_BI;

      referralProgram.latestUpdateTransaction = event.transaction.hash.toHexString();
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
        referralPosition.isAffiliate = false
        referralPosition.totalAffiliateComission = ZERO_BI;
        referralPosition.totalTraderDiscount = ZERO_BI;
        referralPosition.totalAirdroppedAmount = ZERO_BI;
        referralPosition.totalRewardsPending = ZERO_BI;
    }
    return referralPosition
}