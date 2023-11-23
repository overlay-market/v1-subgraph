import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { ReferralProgram } from '../generated/schema'
import { ReferralList } from '../generated/ReferralList/ReferralList'

export function loadReferralProgram(event: ethereum.Event, referralAddress: Address): ReferralProgram {
    let referralProgram = ReferralProgram.load(referralAddress.toHexString())
  
    // create new referralProgram if null
    if (referralProgram === null) {
      referralProgram = new ReferralProgram(referralAddress.toHexString())
      let referralContract = ReferralList.bind(referralAddress)

      referralProgram.createdAtTimestamp = event.block.timestamp
      referralProgram.createdAtBlockNumber = event.block.number

      referralProgram.rewardToken = referralContract.rewardToken();
      referralProgram.affiliateComission = referralContract.affiliateComission();
      referralProgram.traderDiscount = referralContract.traderDiscount();

      referralProgram.latestUpdateTransaction = event.transaction.hash.toHexString();
    }
  
    return referralProgram
}