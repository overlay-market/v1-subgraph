import { Address, log } from "@graphprotocol/graph-ts"
import {LoanOpened as LoanOpenedEvent, LoanSettled as LoanSettledEvent} from "../generated/LBSC/LBSC"
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

        if (position.isLiquidated) {
            const liquidateSize = position.liquidates.load()[0].size
            owner.realizedPnlOvl = owner.realizedPnlOvl.plus(liquidateSize)
            const stablePnL = liquidateSize.times(stableLoan.stableAmount).div(stableLoan.ovlAmount)
            owner.realizedPnlStables = owner.realizedPnlStables.minus(stablePnL)
        } else {
            const latestUnwind = loadLatestUnwind(position)
            if (latestUnwind === null) {
                log.error('Position id: {}', [position.id])
                log.error('No Unwind for handleLoanSettled', [])
                return
            }

            owner.realizedPnlOvl = owner.realizedPnlOvl.minus(latestUnwind.pnl)
            const stablePnL = latestUnwind.pnl.times(stableLoan.stableAmount).div(stableLoan.ovlAmount)
            owner.realizedPnlStables = owner.realizedPnlStables.plus(stablePnL)
        }

        owner.save()
    }

    stableLoan.save()
}
