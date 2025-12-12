import { Address, log, crypto, ByteArray } from "@graphprotocol/graph-ts"
import { LoanOpened as LoanOpenedEvent, LoanSettled as LoanSettledEvent } from "../generated/LBSC/LBSC"
import { StableLoan } from "../generated/schema"
import { loadAccount, loadLatestUnwind } from "./utils"
import { ZERO_BI } from "./utils/constants"

export function handleLoanOpened(event: LoanOpenedEvent): void {
    const borrower = loadAccount(event.params.borrower)
    const loanId = event.params.loanId
    const stableLoanId = event.address.toHexString().concat('-').concat(loanId.toString())

    let stableLoan = StableLoan.load(stableLoanId)

    if (stableLoan === null) {
        stableLoan = new StableLoan(stableLoanId)
    }

    stableLoan.loanId = loanId
    stableLoan.borrower = borrower.id
    stableLoan.stableAmount = event.params.stableAmount
    stableLoan.ovlAmount = event.params.ovlAmount
    stableLoan.price = event.params.price
    stableLoan.ovlRepaid = ZERO_BI
    stableLoan.collateralReturned = ZERO_BI
    stableLoan.collateralSeized = ZERO_BI

    borrower.save()
    stableLoan.save()
}

export function handleLoanSettled(event: LoanSettledEvent): void {
    const loanId = event.params.loanId
    const stableLoanId = event.address.toHexString().concat('-').concat(loanId.toString())

    let stableLoan = StableLoan.load(stableLoanId)

    if (stableLoan === null) {
        log.error('No Loan found. LoanId: {}', [loanId.toHexString()])
        return
    }

    stableLoan.ovlRepaid = event.params.ovlRepaid
    stableLoan.collateralReturned = event.params.collateralReturned
    stableLoan.collateralSeized = event.params.collateralSeized

    if (stableLoan.collateralSeized.gt(ZERO_BI)) {
        let owner = loadAccount(Address.fromBytes(stableLoan.borrower))
        let position = stableLoan.positions.load()[0] // Safe to use index 0 because only one position per loan
        const latestUnwind = loadLatestUnwind(position)

        if (latestUnwind) {
            // check if the latest unwind actually belongs to the same tx
            const isUnwindFromSameTx = latestUnwind.transaction.equals(event.transaction.hash)

            if (isUnwindFromSameTx) {
                // check that the ShivaUnwind event is emmited right before the LoanSettled event
                const shivaUnwindSignature = crypto.keccak256(ByteArray.fromUTF8("ShivaUnwind(address,address,address,uint256,uint256,uint32)"))
                let isOrderedRequest = false

                if (event.receipt) {
                    const logs = event.receipt!.logs
                    const currentLogIndex = event.logIndex

                    for (let i = 0; i < logs.length; i++) {
                        if (logs[i].logIndex.equals(currentLogIndex)) {
                            if (i > 0) {
                                const previousLog = logs[i - 1]
                                if (previousLog.topics.length > 0 && previousLog.topics[0].equals(shivaUnwindSignature)) {
                                    isOrderedRequest = true
                                }
                            } else {
                                log.error('No previous log found for log index {}', [currentLogIndex.toString()])
                            }
                            break
                        }
                    }
                } else {
                    log.error('No receipt found for transaction {}', [event.transaction.hash.toString()])
                }

                if (isOrderedRequest) {
                    owner.realizedPnlOvl = owner.realizedPnlOvl.minus(latestUnwind.pnl)
                    const stablePnL = latestUnwind.pnl.times(stableLoan.stableAmount).div(stableLoan.ovlAmount)
                    owner.realizedPnlStables = owner.realizedPnlStables.plus(stablePnL)
                    owner.save()
                } else {
                    log.info('Latest unwind {} was not emmitted right before the LoanSettled event {} - assumed to be a liquidated position with previous partial unwind with really weird behavior', [latestUnwind.id, event.transaction.hash.toString()])
                }
            } else {
                log.info('Latest unwind {} does not belong to the same tx as the LoanSettled event {} - assumed to be a liquidated position with previous partial unwind', [latestUnwind.id, event.transaction.hash.toString()])
            }
        } else {
            log.info('Position id: {} has no unwinds - assumed to be a liquidated position', [position.id])
        }
    }

    stableLoan.save()
}
